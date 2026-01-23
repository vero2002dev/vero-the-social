"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PendingMatchCard from "@/components/PendingMatchCard";
import RevealRequestCard from "@/components/RevealRequestCard";
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
import { rpcUsage } from "@/lib/invites";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import { logEvent } from "@/lib/events";
import { useRouter } from "next/navigation";

export default function InboxPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileMini[]>([]);
  const [reveals, setReveals] = useState<RevealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyMatchId, setBusyMatchId] = useState<number | null>(null);
  const [busyRevealId, setBusyRevealId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);

  const router = useRouter();

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessao invalida.");
      setMe(userId);

      const usage = await rpcUsage();
      setUnlockedCookie(!!usage.unlocked);
      if (!usage.unlocked) {
        router.push("/unlock");
        return;
      }

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
    } catch (e: any) {
      setErr(e?.message ?? "Erro a carregar inbox.");
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
      await new Promise((r) => setTimeout(r, 1200));
      const res = await rpcRespondMatch({ match_id: matchId, action: "accept" });
      const convId = res.conversation_id;
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      await logEvent("match_accept");
      if (convId) router.push(`/chat/${convId}`);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao aceitar.");
    } finally {
      setBusyMatchId(null);
    }
  }

  async function reject(matchId: number) {
    setErr(null);
    setBusyMatchId(matchId);
    try {
      await rpcRespondMatch({ match_id: matchId, action: "reject" });
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao rejeitar.");
    } finally {
      setBusyMatchId(null);
    }
  }

  async function acceptReveal(id: number) {
    setBusyRevealId(id);
    try {
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
      await rpcRespondReveal(id, "reject");
      setReveals((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyRevealId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Pedidos pendentes. Poucos. Reais.
            </p>
          </div>
          <button
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
            onClick={load}
          >
            Atualizar
          </button>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Reveals</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Pedidos de consentimento pendentes.
          </p>

          {reveals.length === 0 ? (
            <div className="mt-3 text-sm text-neutral-500">Nada por agora.</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4">
              {reveals.map((r) => (
                <RevealRequestCard
                  key={r.id}
                  reveal={r}
                  onAccept={() => acceptReveal(r.id)}
                  onReject={() => rejectReveal(r.id)}
                  busy={busyRevealId === r.id}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-neutral-400">A carregar...</div>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-medium">Nada por agora.</div>
              <div className="mt-1 text-sm text-neutral-400">
                Quando alguem pedir entrada, aparece aqui.
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                Houve quem aceitasse e nunca respondesse. Foi intencional.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {matches.map((m) => {
                const otherId = me ? (m.user1 === me ? m.user2 : m.user1) : m.user1;
                return (
                  <PendingMatchCard
                    key={m.id}
                    match={m}
                    other={byId.get(otherId)}
                    onAccept={() => accept(m.id)}
                    onReject={() => reject(m.id)}
                    busy={busyMatchId === m.id}
                  />
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-neutral-500">
          VERO: decisoes rapidas. Sem jogos infinitos.
        </p>
      </div>
    </main>
  );
}
