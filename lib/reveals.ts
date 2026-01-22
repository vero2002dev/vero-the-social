import { supabase } from "@/lib/supabaseClient";

export type RevealRow = {
  id: number;
  from_user: string;
  to_user: string;
  kind: "profile" | "media";
  status: "requested" | "accepted" | "rejected" | "expired";
  created_at: string;
  expires_at: string;
};

export async function fetchPendingRevealsForMe() {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Sessao invalida.");

  const { data, error } = await supabase
    .from("reveals")
    .select("id,from_user,to_user,kind,status,created_at,expires_at")
    .eq("to_user", me)
    .eq("status", "requested")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RevealRow[];
}

export async function rpcRespondReveal(revealId: number, action: "accept" | "reject") {
  const { data, error } = await supabase.rpc("rpc_respond_reveal", {
    p_reveal_id: revealId,
    p_action: action,
  });
  if (error) throw error;
  return data;
}

export async function hasAcceptedMediaRevealForConversation(conversationId: number) {
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id,match_id,matches!inner(*)")
    .eq("id", conversationId)
    .single();

  if (convErr) throw convErr;
  const matchRow = (conv as any).matches;
  if (!matchRow || matchRow.status !== "active") return false;
  const user1 = matchRow.user1 ?? matchRow.user_a;
  const user2 = matchRow.user2 ?? matchRow.user_b;
  if (!user1 || !user2) return false;

  const { data, error } = await supabase
    .from("reveals")
    .select("id")
    .eq("kind", "media")
    .eq("status", "accepted")
    .or(
      `and(from_user.eq.${user1},to_user.eq.${user2}),and(from_user.eq.${user2},to_user.eq.${user1})`
    )
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}
