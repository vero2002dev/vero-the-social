"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InboxItem from "@/components/InboxItem";
import {
  fetchPendingMatches,
  fetchProfilesMini,
  rpcRespondMatch,
  type MatchRow,
  type ProfileMini,
} from "@/lib/inbox";
import {
  fetchPendingRevealsForMe,
  rpcRespondReveal,
  type RevealRow,
} from "@/lib/reveals";
import { logEvent } from "@/lib/events";
import AppShell from "@/components/AppShell";
import Skeleton from "@/components/Skeleton";
import Toast from "@/components/Toast";
import { haptic } from "@/lib/haptics";
import { getMyGateState } from "@/lib/profileGate";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function InboxPage() {
  const { t } = useI18n();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileMini[]>([]);
  const [reveals, setReveals] = useState<RevealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyMatchId, setBusyMatchId] = useState<number | null>(null);
  const [busyRevealId, setBusyRevealId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [intents, setIntents] = useState<Record<string, { intent_key: string | null; intensity: number | null }>>(
    {}
  );

  const router = useRouter();

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const gate = await getMyGateState();
      if (!gate.legalAccepted) {
        router.push("/legal/terms");
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error(t("common.session_invalid"));
      setMe(userId);

      const pending = await fetchPendingMatches();
      setMatches(pending);

      const pendingReveals = await fetchPendingRevealsForMe();
      setReveals(pendingReveals);

      const otherIds = Array.from(
        new Set(
          pending.map((m) => (m.user1 === userId ? m.user2 : m.user1))
        )
      );

      const minis = await fetchProfilesMini(otherIds);
      setProfiles(minis);

      if (otherIds.length > 0) {
        const { data: intentsRows } = await supabase
          .from("intents")
          .select("user_id,intent_key,intensity,created_at,expires_at")
          .in("user_id", otherIds)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        const map: Record<string, { intent_key: string | null; intensity: number | null }> = {};
        (intentsRows ?? []).forEach((row: any) => {
          if (!map[row.user_id]) {
            map[row.user_id] = { intent_key: row.intent_key ?? null, intensity: row.intensity ?? null };
          }
        });
        setIntents(map);
      } else {
        setIntents({});
      }
    } catch (e: any) {
      setErr(e?.message ?? t("inbox.error.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byId = useMemo(() => {
    const map = new Map<string, ProfileMini>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  async function accept(matchId: number) {
    setErr(null);
    setBusyMatchId(matchId);
    try {
      haptic(30);
      await new Promise((r) => setTimeout(r, 1200));
      const res = await rpcRespondMatch({ match_id: matchId, action: "accept" });
      const convId = res.conversation_id;
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      await logEvent("match_accept");
      if (convId) router.push(`/chat/${convId}`);
    } catch (e: any) {
      setErr(e?.message ?? t("inbox.error.accept"));
    } finally {
      setBusyMatchId(null);
    }
  }

  async function reject(matchId: number) {
    setErr(null);
    setBusyMatchId(matchId);
    try {
      haptic(10);
      await new Promise((r) => setTimeout(r, 600));
      await rpcRespondMatch({ match_id: matchId, action: "reject" });
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (e: any) {
      setErr(e?.message ?? t("inbox.error.reject"));
    } finally {
      setBusyMatchId(null);
    }
  }

  async function acceptReveal(id: number) {
    setBusyRevealId(id);
    try {
      haptic(20);
      await new Promise((r) => setTimeout(r, 1000));
      await rpcRespondReveal(id, "accept");
      setReveals((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyRevealId(null);
    }
  }

  async function rejectReveal(id: number) {
    setBusyRevealId(id);
    try {
      haptic(10);
      await new Promise((r) => setTimeout(r, 600));
      await rpcRespondReveal(id, "reject");
      setReveals((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyRevealId(null);
    }
  }

  return (
    <AppShell
      title={t("inbox.title")}
      right={
        <div className="flex gap-2">
          <button
            className="rounded-2xl border border-white/10 px-3 py-2 text-xs hover:border-white/20"
            onClick={() => router.push("/invite")}
          >
            {t("common.invites")}
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
      <p className="text-sm text-neutral-400">{t("inbox.summary")}</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-neutral-300">{t("inbox.pending")}</div>
        <div className="mt-1 text-xs text-neutral-500">{t("inbox.rule")}</div>
      </div>

      <div className="mt-5">
        {loading ? (
          <InboxSkeleton />
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium">{t("inbox.empty.title")}</div>
            <div className="mt-1 text-sm text-neutral-400">
              {t("inbox.empty.subtitle")}
            </div>
            <div className="mt-3 text-xs text-neutral-500">
              {t("tone.accepted_no_reply")}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {matches.map((m) => {
              const otherId = me ? (m.user1 === me ? m.user2 : m.user1) : m.user1;
              const intent = intents[otherId];
              const subtitle = intent?.intent_key
                ? `${formatIntent(t, intent.intent_key)}${intent.intensity ? ` · ${dots(intent.intensity)}` : ""}`
                : null;
              return (
                <InboxItem
                  key={m.id}
                  title={(byId.get(otherId)?.display_name ?? byId.get(otherId)?.username ?? "Utilizador") as string}
                  subtitle={subtitle}
                  expiresIn={timeLeft(m.expires_at)}
                  onAccept={() => accept(m.id)}
                  onReject={() => reject(m.id)}
                  busy={busyMatchId === m.id}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-neutral-300">{t("inbox.reveals")}</div>
        <div className="mt-1 text-xs text-neutral-500">{t("inbox.reveals_sub")}</div>
      </div>

      <div className="mt-5">
        {loading ? (
          <InboxSkeleton />
        ) : reveals.length === 0 ? (
          <div className="text-sm text-neutral-500">{t("inbox.empty.title")}</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {reveals.map((r) => {
              const name =
                profiles.find((p) => p.id === r.from_user)?.display_name ||
                profiles.find((p) => p.id === r.from_user)?.username ||
                "Utilizador";
              const subtitle =
                r.kind === "media" ? t("inbox.reveal_media") : t("inbox.reveal_profile");
              return (
                <InboxItem
                  key={r.id}
                  title={name}
                  subtitle={subtitle}
                  expiresIn={timeLeft(r.expires_at)}
                  onAccept={() => acceptReveal(r.id)}
                  onReject={() => rejectReveal(r.id)}
                  busy={busyRevealId === r.id}
                />
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-neutral-500">{t("inbox.footer")}</p>
      <Toast text={err} onClose={() => setErr(null)} />
    </AppShell>
  );
}

function InboxSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <Skeleton h={16} />
          <div className="mt-2">
            <Skeleton h={12} />
          </div>
          <div className="mt-3">
            <Skeleton h={10} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton h={38} />
            <Skeleton h={38} />
          </div>
        </div>
      ))}
    </div>
  );
}

function dots(n: number) {
  const x = Math.max(1, Math.min(5, n));
  return "●".repeat(x) + "○".repeat(5 - x);
}

function formatIntent(t: (key: string) => string, k?: string | null) {
  switch (k) {
    case "curiosity":
      return t("intent.curiosity");
    case "connection":
      return t("intent.connection");
    case "desire":
      return t("intent.desire");
    case "private":
      return t("intent.private");
    case "casual":
      return t("intent.casual");
    case "no_labels":
      return t("intent.no_labels");
    default:
      return "—";
  }
}

function timeLeft(expiresAtISO: string) {
  const exp = new Date(expiresAtISO).getTime();
  const now = Date.now();
  const diff = exp - now;
  if (diff <= 0) return "0h";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours <= 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}
