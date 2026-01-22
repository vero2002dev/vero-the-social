import { supabase } from "@/lib/supabaseClient";

export async function getSignedAvatarUrl(path: string, ttlSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, ttlSeconds);
  if (error) throw error;
  return data.signedUrl;
}
