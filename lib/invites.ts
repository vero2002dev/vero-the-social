import { supabase } from "@/lib/supabaseClient";

export type InviteRow = {
  id: number;
  code: string;
  status: "active" | "consumed" | "revoked" | "expired";
  created_at: string;
  expires_at: string;
  consumed_by: string | null;
};

export async function rpcClaimInvite(code: string) {
  const { data, error } = await supabase.rpc("rpc_claim_invite", { p_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as { unlocked: boolean; plan: string };
}

export async function rpcCreateInvite() {
  const { data, error } = await supabase.rpc("rpc_create_invite");
  if (error) throw error;
  return data as any;
}

export async function fetchMyInvites() {
  const { data, error } = await supabase
    .from("invites")
    .select("id,code,status,created_at,expires_at,consumed_by")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as InviteRow[];
}

export async function rpcUsage() {
  const { data, error } = await supabase.rpc("rpc_usage");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as {
    plan: string;
    invite_week_remaining: number;
    invite_week_used: number;
    invite_week_limit: number;
    match_remaining: number;
    match_used: number;
    match_limit: number;
    discover_remaining: number;
    discover_used: number;
    discover_limit: number;
    unlocked: boolean;
  };
}
