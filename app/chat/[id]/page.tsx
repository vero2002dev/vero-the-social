"use client";

import { useEffect, useState } from "react";
import {
  fetchConversation,
  fetchMessages,
  sendImageMessage,
  sendTextMessage,
  type MessageRow,
} from "@/lib/chat";
import ChatComposer from "@/components/ChatComposer";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { rpcRequestReveal } from "@/lib/reveal";
import { signedChatMediaUrl } from "@/lib/chatMedia";
import { hasAcceptedMediaRevealForConversation } from "@/lib/reveals";
import ImagePickerButton from "@/components/ImagePickerButton";
import { rpcUsage } from "@/lib/invites";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import { logEvent } from "@/lib/events";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [revealMsg, setRevealMsg] = useState<string | null>(null);
  const [canSendMedia, setCanSendMedia] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<number, string>>({});

  async function refreshGate() {
    try {
      const allowed = await hasAcceptedMediaRevealForConversation(conversationId);
      setCanSendMedia(allowed);
    } catch {
      setCanSendMedia(false);
    }
  }

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const usage = await rpcUsage();
      setUnlockedCookie(!!usage.unlocked);
      if (!usage.unlocked) {
        router.push("/unlock");
        return;
      }
      const conv = await fetchConversation(conversationId);
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id ?? null;
      if (me) {
        const { data: matchRow, error: matchErr } = await supabase
          .from("matches")
          .select("*")
          .eq("id", conv.match_id)
          .maybeSingle();
        if (!matchErr && matchRow) {
          const a = (matchRow as any).user1 ?? (matchRow as any).user_a;
          const b = (matchRow as any).user2 ?? (matchRow as any).user_b;
          const other = a === me ? b : a;
          setOtherUserId(other);
        }
      }
      const msgs = await fetchMessages(conversationId);
      setMessages(msgs);
      await refreshGate();
    } catch (e: any) {
      setErr(e?.message ?? "Erro a abrir conversa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(conversationId)) return;
    load();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function refresh() {
    setRefreshing(true);
    try {
      const msgs = await fetchMessages(conversationId);
      setMessages(msgs);
      await refreshGate();
    } finally {
      setRefreshing(false);
    }
  }

  async function onSend(text: string) {
    setErr(null);
    try {
      await sendTextMessage(conversationId, text);
      await logEvent("chat_send_text");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao enviar.");
    }
  }

  async function onPickImage(file: File) {
    setErr(null);
    setSendingImage(true);
    try {
      await sendImageMessage(conversationId, file);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao enviar imagem.");
    } finally {
      setSendingImage(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const images = messages.filter(
        (m) => m.type === "image" && m.image_path && m.image_path !== "uploading"
      );
      if (images.length === 0) return;

      const urls = await Promise.all(
        images.map(async (m) => {
          try {
            const url = await signedChatMediaUrl(m.image_path as string);
            return { id: m.id, url };
          } catch {
            return null;
          }
        })
      );

      if (!alive) return;
      setMediaUrls((prev) => {
        const next = { ...prev };
        urls.forEach((entry) => {
          if (entry && !next[entry.id]) {
            next[entry.id] = entry.url;
          }
        });
        return next;
      });
    })();

    return () => {
      alive = false;
    };
  }, [messages]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <button
            className="text-sm text-neutral-300 hover:text-white"
            onClick={() => router.push("/inbox")}
          >
            ← Inbox
          </button>

          <div className="font-medium">Conversa</div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20 disabled:opacity-60"
              onClick={async () => {
                if (!otherUserId) return;
                try {
                  await rpcRequestReveal(otherUserId, "profile");
                  setRevealMsg("Reveal de perfil pedido.");
                } catch (e: any) {
                  setRevealMsg(e?.message ?? "Erro no reveal.");
                }
              }}
              disabled={!otherUserId}
            >
              Reveal Perfil
            </button>
            <button
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20 disabled:opacity-60"
              onClick={async () => {
                if (!otherUserId) return;
                try {
                  await rpcRequestReveal(otherUserId, "media");
                  setRevealMsg("Reveal de media pedido.");
                } catch (e: any) {
                  setRevealMsg(e?.message ?? "Erro no reveal.");
                }
              }}
              disabled={!otherUserId}
            >
              Reveal Media
            </button>
            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20 disabled:opacity-60"
              onClick={refresh}
              disabled={refreshing}
            >
              {refreshing ? "…" : "Atualizar"}
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {err && <div className="mb-4 text-sm text-red-400">{err}</div>}
          {revealMsg && <div className="mb-4 text-sm text-neutral-400">{revealMsg}</div>}

          {loading ? (
            <div className="text-sm text-neutral-400">A carregar...</div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-medium">Comeca simples.</div>
              <div className="mt-1 text-sm text-neutral-400">
                Uma pergunta direta &gt; uma frase bonita.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="text-xs text-neutral-500">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-neutral-100">
                    {m.type === "text" ? (
                      m.text
                    ) : m.image_path === "uploading" ? (
                      <span className="text-neutral-400">a enviar...</span>
                    ) : mediaUrls[m.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrls[m.id]}
                        alt=""
                        className="mt-2 max-w-full rounded-xl"
                      />
                    ) : (
                      <span className="text-neutral-400">imagem privada</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-black px-4 py-2 text-xs text-neutral-500 flex items-center justify-between">
          <span>
            {canSendMedia ? "Media desbloqueado" : "Media bloqueado ate consentimento."}
          </span>
          <ImagePickerButton
            onPick={onPickImage}
            disabled={!canSendMedia || sendingImage || loading}
          />
        </div>
        <ChatComposer onSend={onSend} disabled={loading} showBorder={false} />
      </div>
    </main>
  );
}
