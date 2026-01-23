"use client";

import { useEffect, useState } from "react";
import { rpcClaimInvite, rpcUsage } from "@/lib/invites";
import { useRouter } from "next/navigation";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import { logEvent } from "@/lib/events";

export default function UnlockPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const usage = await rpcUsage();
        if (usage.unlocked) {
          setUnlockedCookie(true);
          router.push("/intent");
        }
      } catch {
        // ignore
      }
    })();
  }, [router]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      await rpcClaimInvite(code.trim());
      await logEvent("unlock_success");
      await new Promise((r) => setTimeout(r, 600));
      setUnlockedCookie(true);
      router.push("/intent");
    } catch (e: any) {
      setErr(e?.message ?? "Codigo invalido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-start justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar no VERO</h1>
        <p className="mt-2 text-sm text-neutral-400">
          VERO e por convite. Introduz o teu codigo.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Algumas regras nao sao ditas. Sao sentidas.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Algumas conversas aqui comecaram com uma frase.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Codigo"
          className="mt-6 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
        />

        {err && <div className="mt-3 text-sm text-red-400">{err}</div>}

        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-white text-black py-3 font-medium disabled:opacity-60"
        >
          {loading ? "A validar..." : "Desbloquear"}
        </button>

        <p className="mt-3 text-xs text-neutral-500">
          Nao tens convite? Pede a alguem. E intencional.
        </p>
      </div>
    </main>
  );
}
