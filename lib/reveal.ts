import { supabase } from "@/lib/supabaseClient";

export async function rpcRequestReveal(toUser: string, kind: "profile" | "media") {
  const { data, error } = await supabase.rpc("rpc_request_reveal", {
    p_to_user: toUser,
    p_kind: kind,
  });
  if (error) throw error;
  return data;
}
