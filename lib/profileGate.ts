import { supabase } from "@/lib/supabaseClient";

export async function getMyGateState() {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return { unlocked: false, onboarded: false, legalAccepted: false };

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

  let legalAccepted = true;
  const { data: legalVersion } = await supabase
    .from("legal_versions")
    .select("terms_version,privacy_version")
    .eq("id", 1)
    .maybeSingle();

  if (legalVersion?.terms_version && legalVersion?.privacy_version) {
    const { data: consent } = await supabase
      .from("legal_consents")
      .select("terms_version,privacy_version")
      .eq("user_id", me)
      .maybeSingle();

    legalAccepted =
      consent?.terms_version === legalVersion.terms_version &&
      consent?.privacy_version === legalVersion.privacy_version;
  }

  return { unlocked, onboarded, legalAccepted };
}
