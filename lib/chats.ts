import { supabase } from "@/lib/supabaseClient";

export type ChatListItem = {
  conversation_id: number;
  match_id: number;
  other_id: string;
  other_name: string;
  other_avatar_path: string | null;
  last_text: string | null;
  last_at: string | null;
};

export async function fetchActiveChats(): Promise<ChatListItem[]> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("common.session_invalid");

  const { data: convs, error: convErr } = await supabase
    .from("conversations")
    .select("id, match_id, matches!inner(*)")
    .eq("matches.status", "active")
    .order("id", { ascending: false });

  if (convErr) throw convErr;
  const list = (convs ?? []) as any[];

  const otherIds = Array.from(
    new Set(
      list.map((c) => {
        const m = c.matches;
        const a = m.user1 ?? m.user_a;
        const b = m.user2 ?? m.user_b;
        return a === me ? b : a;
      })
    )
  );

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_path")
    .in("id", otherIds);

  if (profErr) throw profErr;

  const profileMap = new Map<string, any>();
  (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));

  const out: ChatListItem[] = [];
  for (const c of list) {
    const conversation_id = c.id as number;
    const match = c.matches;
    const a = match.user1 ?? match.user_a;
    const b = match.user2 ?? match.user_b;
    const other_id = a === me ? b : a;
    const p = profileMap.get(other_id);

    const { data: msgs, error: msgErr } = await supabase
      .from("messages")
      .select("text,created_at,type")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (msgErr) throw msgErr;
    const last = (msgs ?? [])[0];

    out.push({
      conversation_id,
      match_id: match.id,
      other_id,
      other_name: p?.display_name ?? p?.username ?? "Utilizador",
      other_avatar_path: p?.avatar_path ?? null,
      last_text: last ? (last.type === "text" ? last.text : "📷 imagem") : null,
      last_at: last?.created_at ?? null,
    });
  }

  out.sort((a, b) => (b.last_at ?? "").localeCompare(a.last_at ?? ""));
  return out;
}
