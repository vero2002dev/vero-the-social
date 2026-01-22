import { supabase } from "@/lib/supabaseClient";

export async function uploadChatImage(params: {
  file: File;
  conversationId: number;
  messageId: number;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Sessao invalida.");

  const ext = params.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `user/${me}/convo/${params.conversationId}/${params.messageId}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("private_media")
    .upload(path, params.file, { upsert: false, contentType: params.file.type });

  if (upErr) throw upErr;
  return path;
}

export async function signedChatMediaUrl(path: string, ttlSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from("private_media")
    .createSignedUrl(path, ttlSeconds);
  if (error) throw error;
  return data.signedUrl;
}
