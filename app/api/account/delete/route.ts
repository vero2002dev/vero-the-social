import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

  await sb
    .from("account_deletion_requests")
    .insert({ user_id: userId })
    .select()
    .maybeSingle()
    .catch(() => null);

  const { error: delErr } = await sb.auth.admin.deleteUser(userId);
  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
