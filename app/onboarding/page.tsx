"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyGateState } from "@/lib/profileGate";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const g = await getMyGateState();
      if (!g.unlocked) router.replace("/unlock");
      else if (g.onboarded) router.replace("/discover");
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-start justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Antes de entrar</h1>
        <p className="mt-2 text-sm text-neutral-400">Isto e sobre o agora, nao sobre o para sempre.</p>
        <p className="mt-2 text-xs text-neutral-500">Algumas regras nao sao ditas. Sao sentidas.</p>
        <button
          className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-medium"
          onClick={() => router.push("/intent")}
        >
          Assumir intencao
        </button>
      </div>
    </main>
  );
}
