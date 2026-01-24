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
import SignalsList from "@/components/SignalsList";
import { getMyGateState } from "@/lib/profileGate";
import { useI18n } from "@/components/I18nProvider";
import { resolveI18nError } from "@/lib/i18n/resolveError";

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
  const [starterPrompts, setStarterPrompts] = useState<{ id: number; text: string }[]>([]);
  const [matchCreatedAt, setMatchCreatedAt] = useState<string | null>(null);
  const [nudgeShown, setNudgeShown] = useState<{ first?: boolean; stale?: boolean }>({});
  const [plan, setPlan] = useState<string>("free");
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [signals, setSignals] = useState<
    { id: number; author: string; text?: string | null; image_path?: string | null; created_at: string }[]
  >([]);
  const [signalText, setSignalText] = useState("");
  const [signalOpen, setSignalOpen] = useState(false);
  const [revealState, setRevealState] = useState<{ profile?: boolean; media?: boolean }>({});
  const { t } = useI18n();

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
      const gate = await getMyGateState();
      if (!gate.legalAccepted) {
        router.push("/legal/terms");
        return;
      }
      const usage = await rpcUsage();
      setUnlockedCookie(!!usage.unlocked);
      if (!usage.unlocked) {
        router.push("/unlock");
        return;
      }
      setPlan(usage.plan ?? "free");
      const conv = await fetchConversation(conversationId);
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id ?? null;
      setMeId(me);
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
          setMatchCreatedAt((matchRow as any).created_at ?? null);
        }
      }
      const msgs = await fetchMessages(conversationId);
      setMessages(msgs);
      await refreshGate();
      await loadSignals();
      if (msgs.length === 0) {
        const { data } = await supabase.rpc("rpc_starter_prompts_for_conversation", {
          p_conversation_id: conversationId,
        });
        setStarterPrompts((data ?? []) as any[]);
      }
    } catch (e: any) {
      setErr(resolveI18nError(t, e, t("chat.error.open")));
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
      await loadSignals();
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
      setErr(resolveI18nError(t, e, t("chat.error.send")));
    }
  }

  async function onPickImage(file: File) {
    setErr(null);
    setSendingImage(true);
    try {
      await sendImageMessage(conversationId, file);
      await refresh();
    } catch (e: any) {
      setErr(resolveI18nError(t, e, t("chat.error.send_image")));
    } finally {
      setSendingImage(false);
    }
  }

  async function loadSignals() {
    try {
      const { data, error } = await supabase.rpc("rpc_list_signals", {
        p_conversation: conversationId,
      });
      if (error) return;
      setSignals((data ?? []) as any[]);
    } catch {
      // ignore
    }
  }

  async function createSignal() {
    if (!signalText.trim()) return;
    await supabase.rpc("rpc_create_signal", {
      p_conversation: conversationId,
      p_text: signalText.trim(),
    });
    setSignalText("");
    setSignalOpen(false);
    await loadSignals();
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

  useEffect(() => {
    if (loading) return;
    const now = Date.now();
    if (plan !== "premium" && messages.length === 0 && matchCreatedAt) {
      const ageMs = now - new Date(matchCreatedAt).getTime();
      if (ageMs > 2 * 60 * 60 * 1000 && !nudgeShown.first) {
        setNudgeShown((prev) => ({ ...prev, first: true }));
        logEvent("nudge_shown", { type: "first_message" });
      }
    }
    if (plan !== "premium" && messages.length === 1) {
      const lastAt = new Date(messages[0].created_at).getTime();
      if (now - lastAt > 24 * 60 * 60 * 1000 && !nudgeShown.stale) {
        setNudgeShown((prev) => ({ ...prev, stale: true }));
        logEvent("nudge_shown", { type: "stale_chat" });
      }
    }
  }, [loading, messages, matchCreatedAt, nudgeShown, plan]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <button
            className="text-sm text-neutral-300 hover:text-white"
            onClick={() => router.push("/inbox")}
          >
            {t("common.back", { label: t("nav.inbox") })}
          </button>

          <div className="font-medium">{t("chat.title")}</div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20 disabled:opacity-60"
              onClick={async () => {
                if (!otherUserId) return;
                const reason = window.prompt(
                  t("chat.report.prompt"),
                  t("chat.report.default_reason")
                );
                if (!reason) return;
                setReporting(true);
                try {
                  await supabase.rpc("rpc_report_user", {
                    p_reported: otherUserId,
                    p_reason: reason,
                    p_details: "",
                  });
                  setRevealMsg(t("chat.report.sent"));
                } finally {
                  setReporting(false);
                }
              }}
              disabled={!otherUserId || reporting}
            >
              {t("chat.report")}
            </button>
            <button
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20 disabled:opacity-60"
              onClick={async () => {
                if (!otherUserId) return;
                setBlocking(true);
                try {
                  await supabase.rpc("rpc_block_user", { p_blocked: otherUserId });
                  router.replace("/chats");
                } finally {
                  setBlocking(false);
                }
              }}
              disabled={!otherUserId || blocking}
            >
              {t("chat.block")}
            </button>
            <button
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20 disabled:opacity-60"
              onClick={async () => {
                if (!otherUserId) return;
                try {
                  await rpcRequestReveal(otherUserId, "profile");
                  setRevealMsg(t("chat.reveal.sent_profile"));
                  setRevealState((prev) => ({ ...prev, profile: true }));
                  setTimeout(
                    () => setRevealState((prev) => ({ ...prev, profile: false })),
                    2500
                  );
                } catch (e: any) {
                  setRevealMsg(e?.message ?? t("chat.error.reveal"));
                }
              }}
              disabled={!otherUserId}
              style={revealState.profile ? { opacity: 0.65 } : undefined}
            >
              {revealState.profile ? t("chat.reveal.done") : t("chat.reveal.profile")}
            </button>
            <button
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20 disabled:opacity-60"
              onClick={async () => {
                if (!otherUserId) return;
                try {
                  await rpcRequestReveal(otherUserId, "media");
                  setRevealMsg(t("chat.reveal.sent_media"));
                  setRevealState((prev) => ({ ...prev, media: true }));
                  setTimeout(
                    () => setRevealState((prev) => ({ ...prev, media: false })),
                    2500
                  );
                } catch (e: any) {
                  setRevealMsg(e?.message ?? t("chat.error.reveal"));
                }
              }}
              disabled={!otherUserId}
              style={revealState.media ? { opacity: 0.65 } : undefined}
            >
              {revealState.media ? t("chat.reveal.done") : t("chat.reveal.media")}
            </button>
            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20 disabled:opacity-60"
              onClick={refresh}
              disabled={refreshing}
            >
              {refreshing ? "…" : t("chat.update")}
            </button>
          </div>
        </div>
        <div className="px-6 pt-2 text-xs text-neutral-500">{t("chat.hint")}</div>

        <div className="flex-1 p-6 overflow-y-auto pb-40">
          {err && <div className="mb-4 text-sm text-red-400">{err}</div>}
          {revealMsg && <div className="mb-4 text-sm text-neutral-400">{revealMsg}</div>}

          {signals.length === 0 ? (
            <div className="mb-4 text-xs text-neutral-500">{t("tone.signals_not_chat")}</div>
          ) : null}
          {meId ? <SignalsList signals={signals} me={meId} /> : null}
          <div className="mb-4">
            {signalOpen ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <input
                  value={signalText}
                  onChange={(e) => setSignalText(e.target.value)}
                  placeholder={t("chat.signal.placeholder")}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  maxLength={140}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={createSignal}
                    className="rounded-2xl bg-white text-black py-2 text-sm font-medium"
                  >
                    {t("chat.signal.publish")}
                  </button>
                  <button
                    onClick={() => {
                      setSignalOpen(false);
                      setSignalText("");
                    }}
                    className="rounded-2xl border border-white/10 py-2 text-sm text-neutral-200 hover:border-white/20"
                  >
                    {t("chat.signal.close")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSignalOpen(true)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs text-neutral-200 hover:border-white/20"
              >
                {t("chat.signal.add")}
              </button>
            )}
          </div>

          {messages.length === 0 && starterPrompts.length > 0 ? (
            <div className="mb-4 space-y-2">
              <div className="text-xs text-neutral-500">{t("chat.starter.title")}</div>
              {starterPrompts.map((p) => (
                <button
                  key={p.id}
                  onClick={async () => {
                    await onSend(p.text);
                    await logEvent("starter_prompt_used", { conversationId });
                  }}
                  className="block w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
                >
                  {p.text}
                </button>
              ))}
            </div>
          ) : null}

          {!loading && plan !== "premium" && nudgeShown.first ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-neutral-300">
              {t("chat.nudge.first")}
            </div>
          ) : null}
          {!loading && plan !== "premium" && nudgeShown.stale ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-neutral-300">
              {t("chat.nudge.stale")}
            </div>
          ) : null}
          {!loading && plan !== "premium" && messages.length === 0 && matchCreatedAt ? (
            new Date(matchCreatedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000 ? (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-neutral-300">
                {t("chat.nudge.expire")}
              </div>
            ) : null
          ) : null}

          {loading ? (
            <div className="text-sm text-neutral-400">{t("common.loading")}</div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-medium">{t("tone.silence_choice")}</div>
              <div className="mt-1 text-sm text-neutral-400">{t("chat.hint")}</div>
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
                      <span className="text-neutral-400">{t("chat.media.sending")}</span>
                    ) : mediaUrls[m.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrls[m.id]}
                        alt=""
                        className="mt-2 max-w-full rounded-xl"
                      />
                    ) : (
                      <span className="text-neutral-400">{t("chat.image_private")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="max-w-xl mx-auto px-4 pb-2">
            <div className="rounded-2xl border border-white/10 bg-black/90 backdrop-blur">
              <div className="px-4 py-2 text-xs text-neutral-500 flex items-center justify-between border-b border-white/10">
                <span>
                  {canSendMedia ? t("chat.media.unlocked") : t("chat.media.locked")}
                </span>
                <ImagePickerButton
                  onPick={onPickImage}
                  disabled={!canSendMedia || sendingImage || loading}
                />
              </div>
              <ChatComposer onSend={onSend} disabled={loading} showBorder={false} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
