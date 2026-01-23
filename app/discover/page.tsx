"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import DiscoverCard from "@/components/DiscoverCard";
import DiscoverControls from "@/components/DiscoverControls";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/events";
import { rpcUsage } from "@/lib/invites";
import { getMyGateState } from "@/lib/profileGate";
import { useRouter } from "next/navigation";

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
      setMsg(e?.message ?? "Erro no discover.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function pass() {
    if (!current) return;
    logEvent("discover_pass", { target: current.id });
    setIdx((i) => i + 1);
  }

  async function request() {
    if (!current) return;
    setBusy(true);
    setMsg(null);

    await new Promise((r) => setTimeout(r, 800));

    try {
      const { error } = await supabase.rpc("rpc_request_match", { p_target: current.id });
      if (error) throw error;

      await logEvent("match_request", { target: current.id });

      setMsg("Pedido enviado. Agora esperas.");
      setIdx((i) => i + 1);
    } catch (e: any) {
      setMsg(e?.message ?? "Nao foi possivel pedir entrada.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = usage?.match_remaining;

  return (
    <AppShell
      title="Descobrir"
      right={
        <button
          onClick={load}
          className="text-sm text-neutral-300 hover:text-white"
          disabled={loading}
        >
          Atualizar
        </button>
      }
    >
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-neutral-300">
          Pedidos restantes hoje:{" "}
          <span className="text-white font-medium">
            {typeof remaining === "number" ? remaining : "—"}
          </span>
        </div>
        <div className="mt-1 text-xs text-neutral-500">Poucos pedidos. Melhor escolha.</div>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-400">A carregar...</div>
      ) : !current ? (
        <EmptyDiscover onReload={load} />
      ) : (
        <>
          <div className="relative">
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

          <div className="mt-4 text-xs text-neutral-500">O silencio tambem e uma escolha.</div>
        </>
      )}
    </AppShell>
  );
}

function EmptyDiscover({ onReload }: { onReload: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-lg font-semibold">Nada por agora.</div>
      <div className="mt-2 text-sm text-neutral-400">
        Volta mais tarde. Ou ajusta a tua intencao.
      </div>
      <button
        onClick={onReload}
        className="mt-4 w-full rounded-2xl bg-white text-black py-3 text-sm font-medium"
      >
        Recarregar
      </button>
    </div>
  );
}
