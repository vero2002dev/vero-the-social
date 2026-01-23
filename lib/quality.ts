import { supabase } from "@/lib/supabaseClient";

export async function rpcUserQuality() {
  const { data, error } = await supabase.rpc("rpc_user_quality");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as {
    accept_rate: number;
    chat_rate: number;
    discover_bonus: number;
    match_bonus: number;
  };
}
