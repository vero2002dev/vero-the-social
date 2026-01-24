import { supabase } from "@/lib/supabaseClient";

export async function requireUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user) throw new Error("common.session_invalid");
  return user;
}
