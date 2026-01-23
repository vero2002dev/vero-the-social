import { supabase } from "@/lib/supabaseClient";

export async function getMyGateState() {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return { unlocked: false, onboarded: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("unlocked")
    .eq("id", me)
    .maybeSingle();

  const unlocked = !!profile?.unlocked;

  const { data: intentRow } = await supabase
    .from("intents")
    .select("id")
    .eq("user_id", me)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const onboarded = !!intentRow?.id;

  return { unlocked, onboarded };
}
