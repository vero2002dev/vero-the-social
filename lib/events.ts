import { supabase } from "@/lib/supabaseClient";

export async function logEvent(name: string, meta?: Record<string, any>) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    await supabase.from("events").insert({
      user_id: userId,
      name,
      meta: meta ?? null,
    });
  } catch {
    // ignore
  }
}
