import { supabase } from "@/lib/supabaseClient";

export type MatchRow = {
  id: number;
  user1: string;
  user2: string;
  status: "pending" | "active" | "expired" | "blocked";
  created_at: string;
  expires_at: string;
};

export async function fetchPendingMatches() {
  const { data, error } = await supabase.rpc("rpc_inbox_pending");

  if (error) throw error;
  const rows = (data ?? []).map((row: any) => ({
    ...row,
    user1: row.user1 ?? row.user_a,
    user2: row.user2 ?? row.user_b,
  }));
  return rows as MatchRow[];
}

export async function rpcRespondMatch(params: {
  match_id: number;
  action: "accept" | "reject";
}) {
  const { data, error } = await supabase.rpc("rpc_respond_match", {
    p_match_id: params.match_id,
    p_action: params.action,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return row as { match_id: number; status: string; conversation_id: number | null };
}

export type ProfileMini = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_path: string | null;
};

export async function fetchProfilesMini(ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_path")
    .in("id", ids);

  if (error) throw error;
  return (data ?? []) as ProfileMini[];
}
