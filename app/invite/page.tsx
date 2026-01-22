"use client";

import { useEffect, useState } from "react";
import { fetchMyInvites, rpcCreateInvite, rpcUsage } from "@/lib/invites";
import InviteCard from "@/components/InviteCard";
import { useRouter } from "next/navigation";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import { logEvent } from "@/lib/events";

export default function InvitePage() {
  const [usage, setUsage] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const u = await rpcUsage();
      setUsage(u);
      setUnlockedCookie(!!u?.unlocked);
      if (!u?.unlocked) {
        router.push("/unlock");
        return;
      }
      const list = await fetchMyInvites();
      setInvites(list);
    } catch (e: any) {
      setErr(e?.message ?? "Erro a carregar convites.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setErr(null);
    setCreating(true);
    try {
      await rpcCreateInvite();
      await logEvent("invite_create");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Nao foi possivel criar convite.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Convites</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Crescimento privado. Sem links publicos.
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
            onClick={() => router.push("/premium")}
          >
            Premium
          </button>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        {loading ? (
          <div className="mt-6 text-sm text-neutral-400">A carregar...</div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-300">Restantes esta semana</div>
                <div className="text-sm text-neutral-100 font-medium">
                  {usage?.invite_week_remaining}/{usage?.invite_week_limit}
                </div>
              </div>

              <button
                onClick={create}
                disabled={creating || usage?.invite_week_remaining <= 0}
                className="mt-4 w-full rounded-2xl bg-white text-black py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {creating ? "A gerar..." : "Gerar convite"}
              </button>

              <p className="mt-2 text-xs text-neutral-500">
                Regras: convites sao limitados para manter qualidade e FOMO.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              {invites.map((i) => (
                <InviteCard
                  key={i.id}
                  code={i.code}
                  status={i.status}
                  expiresAt={i.expires_at}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
