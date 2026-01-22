import { supabase } from "@/lib/supabaseClient";
import { uploadChatImage } from "@/lib/chatMedia";

export type ConversationRow = {
  id: number;
  match_id: number;
  created_at: string;
};

export type MessageRow = {
  id: number;
  conversation_id: number;
  sender_id: string;
  type: "text" | "image";
  text: string | null;
  image_path: string | null;
  created_at: string;
};

export async function fetchConversation(conversationId: number) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,match_id,created_at")
    .eq("id", conversationId)
    .single();

  if (error) throw error;
  return data as ConversationRow;
}

export async function fetchMessages(conversationId: number) {
  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,type,text,image_path,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendTextMessage(conversationId: number, text: string) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Sessao invalida.");

  const payload = {
    conversation_id: conversationId,
    sender_id: me,
    type: "text",
    text,
    image_path: null,
  };

  const { error } = await supabase.from("messages").insert(payload);
  if (error) throw error;
}

export async function createImageMessagePlaceholder(conversationId: number) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Sessao invalida.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: me,
      type: "image",
      text: null,
      image_path: "uploading",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as number;
}

export async function finalizeImageMessage(messageId: number, imagePath: string) {
  const { error } = await supabase
    .from("messages")
    .update({ image_path: imagePath })
    .eq("id", messageId);

  if (error) throw error;
}

export async function sendImageMessage(conversationId: number, file: File) {
  const msgId = await createImageMessagePlaceholder(conversationId);
  try {
    const path = await uploadChatImage({
      file,
      conversationId,
      messageId: msgId,
    });
    await finalizeImageMessage(msgId, path);
  } catch (err) {
    await supabase.from("messages").delete().eq("id", msgId);
    throw err;
  }
}
