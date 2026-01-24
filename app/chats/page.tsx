"use client";

import { useEffect, useState } from "react";
import { fetchActiveChats, type ChatListItem as Item } from "@/lib/chats";
import ChatListItem from "@/components/ChatListItem";
import { useRouter } from "next/navigation";
import { rpcUsage } from "@/lib/invites";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import AppShell from "@/components/AppShell";
import Skeleton from "@/components/Skeleton";
import Toast from "@/components/Toast";
import { getMyGateState } from "@/lib/profileGate";
import { useI18n } from "@/components/I18nProvider";
import { resolveI18nError } from "@/lib/i18n/resolveError";

export default function ChatsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const router = useRouter();
  const { t } = useI18n();

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
      const data = await fetchActiveChats();
      setItems(data);
    } catch (e: any) {
      setErr(resolveI18nError(t, e, t("chats.error.load")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell
      title={t("nav.chats")}
      right={
        <div className="flex gap-2">
          <button
            className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20"
            onClick={() => router.push("/discover")}
          >
            {t("nav.discover")}
          </button>
          <button
            className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20"
            onClick={load}
          >
            {t("common.update")}
          </button>
        </div>
      }
    >
      <p className="text-sm text-neutral-400">{t("chats.subtitle")}</p>

      <div className="mt-6">
        {plan === "free" && items.length >= 3 ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
            {t("invite.paywall")}
            <button
              className="mt-3 w-full rounded-2xl bg-white text-black py-2.5 text-sm font-medium"
              onClick={() => router.push("/premium")}
            >
              {t("invite.activate")}
            </button>
          </div>
        ) : null}
        {loading ? (
          <ChatSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium">{t("chats.empty.title")}</div>
            <div className="mt-1 text-sm text-neutral-400">{t("chats.empty.subtitle")}</div>
            <div className="mt-3 text-xs text-neutral-500">
              {t("tone.legend_phrase")}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((it) => (
              <ChatListItem key={it.conversation_id} item={it} />
            ))}
          </div>
        )}
      </div>

      {plan !== "premium" ? (
        <p className="mt-8 text-xs text-neutral-500">
          {t("tone.expire_intentional")}
        </p>
      ) : null}
      <Toast text={err} onClose={() => setErr(null)} />
    </AppShell>
  );
}

function ChatSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 animate-pulse" />
            <div className="min-w-0 flex-1">
              <Skeleton h={14} />
              <div className="mt-2">
                <Skeleton h={12} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
