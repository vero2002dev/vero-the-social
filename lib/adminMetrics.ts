import { supabase } from "@/lib/supabaseClient";

export type AdminMetricsRow = {
  day: string;
  unlock_success: number;
  onboarding_done: number;
  intent_set: number;
  discover_view: number;
  match_request: number;
  match_accept: number;
  chat_send_text: number;
  invite_create: number;
  invite_copy: number;
  active_users: number;
};

export async function rpcAdminMetrics(days = 14) {
  const { data, error } = await supabase.rpc("rpc_admin_metrics", { p_days: days });
  if (error) throw error;
  return (data ?? []) as AdminMetricsRow[];
}

export async function rpcAdminKpis(days = 14) {
  const { data, error } = await supabase.rpc("rpc_admin_kpis", { p_days: days });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as any;
}
