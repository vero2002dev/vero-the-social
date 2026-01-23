"use client";

import { useEffect, useState } from "react";
import { rpcDiscover, rpcRequestMatch, type DiscoverRow } from "@/lib/rpc";
import ProfileCard from "@/components/ProfileCard";
import { useRouter } from "next/navigation";
import { rpcUsage } from "@/lib/invites";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import { logEvent } from "@/lib/events";
import { rpcUserQuality } from "@/lib/quality";

export default function DiscoverPage() {
  const [rows, setRows] = useState<DiscoverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quality, setQuality] = useState<{ discover_bonus: number; match_bonus: number } | null>(null);
  const [qualityLogged, setQualityLogged] = useState(false);

  const router = useRouter();

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
      const q = await rpcUserQuality();
      setQuality({ discover_bonus: q.discover_bonus ?? 0, match_bonus: q.match_bonus ?? 0 });
      if (!qualityLogged && (q.discover_bonus > 0 || q.match_bonus > 0)) {
        setQualityLogged(true);
        await logEvent("limits_relaxed", { reason: "high_quality_usage" });
      }
      const data = await rpcDiscover();
      setRows(data);
      await logEvent("discover_view");
    } catch (e: any) {
      setErr(e?.message ?? "Erro no discover.");
    } finally {
      setLoading(false);
    }
  }

  async function onRequest(id: string) {
    setErr(null);
    setBusyId(id);
    try {
      await rpcRequestMatch(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      await logEvent("match_request");
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao pedir match.");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Descobrir</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Poucos perfis. Mais intencao. Menos ruido.
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
            onClick={() => router.push("/intent")}
          >
            Mudar intencao
          </button>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        {quality && (quality.discover_bonus > 0 || quality.match_bonus > 0) ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
            Boa dinamica esta semana. Alguns limites foram aliviados.
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-neutral-400">A carregar...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-medium">Nada agora.</div>
              <div className="mt-1 text-sm text-neutral-400">
                Volta mais tarde — ou muda a intencao.
              </div>
              <button
                className="mt-4 w-full rounded-2xl bg-white text-black py-2.5 font-medium"
                onClick={load}
              >
                Tentar outra vez
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rows.map((r) => (
                <ProfileCard
                  key={r.id}
                  row={r}
                  onRequest={onRequest}
                  requesting={busyId === r.id}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-neutral-500">
          VERO e privado por design. Sem screenshots. Sem show-off.
        </p>
      </div>
    </main>
  );
}
