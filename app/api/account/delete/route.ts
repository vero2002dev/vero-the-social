import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AdminClient = ReturnType<typeof supabaseAdmin>;

async function deletePrefix(
  sb: AdminClient,
  bucket: string,
  prefix: string
) {
  const queue: string[] = [prefix];
  const toDelete: string[] = [];
  const limit = 100;

  while (queue.length > 0) {
    const current = queue.shift()!;
    let offset = 0;
    while (true) {
      const { data, error } = await sb.storage.from(bucket).list(current, {
        limit,
        offset,
      });
      if (error) throw error;
      const items = data ?? [];
      if (items.length === 0) break;

      const base = current.endsWith("/") ? current : `${current}/`;

      for (const item of items) {
        if (!item?.name) continue;
        const isFolder =
          item.name.endsWith("/") ||
          (item as any).metadata?.isFolder ||
          item.id === null;
        const next = `${base}${item.name}`.replace(/\/{2,}/g, "/");
        if (isFolder) {
          const folderPath = next.endsWith("/") ? next : `${next}/`;
          queue.push(folderPath);
        } else {
          toDelete.push(next);
        }
      }

      if (items.length < limit) break;
      offset += limit;
    }
  }

  const batchSize = 100;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const slice = toDelete.slice(i, i + batchSize);
    const { error } = await sb.storage.from(bucket).remove(slice);
    if (error) throw error;
  }
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 401 });
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "invalid token" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "invalid session" }, { status: 401 });
  }

  const userId = data.user.id;

  const { error: reqErr } = await sb
    .from("account_deletion_requests")
    .insert({ user_id: userId })
    .select("*")
    .maybeSingle();

  // Se isto falhar, não bloqueia a eliminação da conta (é só registo)
  void reqErr;

  let purgeFailed = false;
  let purgeError: string | null = null;
  try {
    const prefix = `user/${userId}/`;
    await deletePrefix(sb, "avatars", prefix);
    await deletePrefix(sb, "private_media", prefix);
  } catch (e: any) {
    purgeFailed = true;
    purgeError = e?.message ?? "storage purge failed";
    // keep going: do not block account deletion
    console.error("storage purge failed", e);
  }

  if (purgeFailed) {
    await sb
      .from("account_deletion_requests")
      .update({
        storage_purge_failed: true,
        storage_purge_error: purgeError,
      })
      .eq("user_id", userId);
  }

  const { error: delErr } = await sb.auth.admin.deleteUser(userId);
  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
