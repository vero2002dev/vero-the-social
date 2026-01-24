"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import DiscoverCard from "@/components/DiscoverCard";
import DiscoverControls from "@/components/DiscoverControls";
import Skeleton from "@/components/Skeleton";
import Toast from "@/components/Toast";
import { useSwipe } from "@/components/useSwipe";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/events";
import { rpcUsage } from "@/lib/invites";
import { getMyGateState } from "@/lib/profileGate";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/components/I18nProvider";

type DiscoverRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  intent_key: string | null;
  intensity: number | null;
};

export default function DiscoverPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [usage, setUsage] = useState<any>(null);
  const [cards, setCards] = useState<DiscoverRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const current = useMemo(() => cards[idx] ?? null, [cards, idx]);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const g = await getMyGateState();
      if (!g.legalAccepted) return router.replace("/legal/terms");
      if (!g.unlocked) return router.replace("/unlock");
      if (!g.onboarded) return router.replace("/onboarding");

      const u = await rpcUsage();
      setUsage(u);

      const { data, error } = await supabase.rpc("rpc_discover");
      if (error) throw error;

      const list = (data ?? []) as DiscoverRow[];
      setCards(list);
      setIdx(0);

      await logEvent("discover_view", { count: list.length });
    } catch (e: any) {
      setMsg(e?.message ?? t("discover.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function pass() {
    if (!current) return;
    haptic(10);
    logEvent("discover_pass", { target: current.id });
    setIdx((i) => i + 1);
  }

  async function request() {
    if (!current) return;
    setBusy(true);
    setMsg(null);

    await new Promise((r) => setTimeout(r, 800));

    try {
      haptic(25);
      const { error } = await supabase.rpc("rpc_request_match", { p_target: current.id });
      if (error) throw error;

      await logEvent("match_request", { target: current.id });

      setMsg(t("discover.request_sent"));
      setIdx((i) => i + 1);
    } catch (e: any) {
      setMsg(e?.message ?? t("discover.request_fail"));
    } finally {
      setBusy(false);
    }
  }

  const remaining = usage?.match_remaining;
  const swipe = useSwipe({
    onLeft: pass,
    onRight: request,
    threshold: 70,
  });

  return (
    <AppShell
      title={t("discover.title")}
      right={
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/search")}
            className="text-sm text-neutral-300 hover:text-white"
          >
            {t("common.search")}
          </button>
          <button
            onClick={load}
            className="text-sm text-neutral-300 hover:text-white"
            disabled={loading}
          >
            {t("common.update")}
          </button>
        </div>
      }
    >
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-neutral-300">
          {t("discover.remaining")}:{" "}
          <span className="text-white font-medium">
            {typeof remaining === "number" ? remaining : "—"}
          </span>
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {t("discover.remaining_hint")}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Skeleton h={22} />
            <div className="mt-3">
              <Skeleton h={14} />
            </div>
            <div className="mt-6">
              <Skeleton h={12} />
            </div>
            <div className="mt-2">
              <Skeleton h={18} />
            </div>
            <div className="mt-6">
              <Skeleton h={90} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton h={44} />
            <Skeleton h={44} />
          </div>
        </div>
      ) : !current ? (
        <EmptyDiscover onReload={load} />
      ) : (
        <>
          <div className="relative" {...swipe}>
            {cards[idx + 1] ? (
              <div className="absolute inset-0 translate-y-2 scale-[0.98] opacity-50 pointer-events-none">
                <DiscoverCard
                  username={cards[idx + 1].username}
                  displayName={cards[idx + 1].display_name}
                  bio={cards[idx + 1].bio}
                  intentKey={cards[idx + 1].intent_key}
                  intensity={cards[idx + 1].intensity}
                />
              </div>
            ) : null}

            <DiscoverCard
              username={current.username}
              displayName={current.display_name}
              bio={current.bio}
              intentKey={current.intent_key}
              intensity={current.intensity}
            />
          </div>

          {msg ? <div className="mt-4 text-sm text-neutral-300">{msg}</div> : null}

          <DiscoverControls onPass={pass} onRequest={request} disabled={busy} />

          <div className="mt-4 text-xs text-neutral-500">{t("tone.silence_choice")}</div>
        </>
      )}

      <Toast text={msg} onClose={() => setMsg(null)} />
    </AppShell>
  );
}

function EmptyDiscover({ onReload }: { onReload: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-lg font-semibold">{t("discover.empty.title")}</div>
      <div className="mt-2 text-sm text-neutral-400">
        {t("discover.empty.subtitle")}
      </div>
      <button
        onClick={onReload}
        className="mt-4 w-full rounded-2xl bg-white text-black py-3 text-sm font-medium"
      >
        {t("common.update")}
      </button>
    </div>
  );
}
