import { supabase } from "@/lib/supabaseClient";

export type IntentKey =
  | "curiosity"
  | "connection"
  | "desire"
  | "private"
  | "casual"
  | "no_labels";

export async function rpcSetIntent(params: {
  intent_key: IntentKey;
  intensity: number;
  note?: string;
}) {
  const { data, error } = await supabase.rpc("rpc_set_intent", {
    p_intent_key: params.intent_key,
    p_intensity: params.intensity,
    p_note: params.note ?? null,
  });
  if (error) throw error;
  return data;
}

export type DiscoverRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  intent_key: IntentKey | null;
  intensity: number | null;
  intent_expires_at: string | null;
};

export async function rpcDiscover() {
  const { data, error } = await supabase.rpc("rpc_discover");
  if (error) throw error;
  return (data ?? []) as DiscoverRow[];
}

export async function rpcRequestMatch(targetUserId: string) {
  const { data, error } = await supabase.rpc("rpc_request_match", {
    p_target: targetUserId,
  });
  if (error) throw error;
  return data;
}
