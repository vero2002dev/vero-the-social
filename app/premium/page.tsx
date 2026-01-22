"use client";

import { useEffect, useState } from "react";
import { rpcUsage } from "@/lib/invites";
import { useRouter } from "next/navigation";

export default function PremiumPage() {
  const [u, setU] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const usage = await rpcUsage();
        setU(usage);
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold tracking-tight">VERO Premium</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Mais controlo. Mais acesso. Sem virar app barulhenta.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">Discover / dia</span>
            <span className="text-neutral-100 font-medium">8</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">Match requests / dia</span>
            <span className="text-neutral-100 font-medium">10</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">Convites / semana</span>
            <span className="text-neutral-100 font-medium">5</span>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs text-neutral-500">
            Depois ligamos billing. Agora estamos a validar o motor viral.
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-medium"
          onClick={() => alert("Billing em breve (MVP).")}
        >
          Ativar Premium (EUR 7.99/mes)
        </button>

        <button
          className="mt-3 w-full rounded-2xl border border-white/10 py-3 text-sm hover:border-white/20"
          onClick={() => router.push("/invite")}
        >
          Voltar aos convites
        </button>

        <p className="mt-4 text-xs text-neutral-500">Plano atual: {u?.plan ?? "—"}</p>
      </div>
    </main>
  );
}
