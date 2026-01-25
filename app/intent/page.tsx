"use client";

import IntentPicker from "@/components/IntentPicker";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "@/lib/events";
import { getMyGateState } from "@/lib/profileGate";

export default function IntentPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const gate = await getMyGateState();
        if (!gate.legalAccepted) {
          router.push("/legal/terms");
          return;
        }
        await logEvent("onboarding_done");
      } catch {
        // ignore
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-start justify-center">
      <div className="w-full">
        <div className="max-w-xl mx-auto px-6 pt-6 text-xs text-neutral-500">
          Algumas regras nao sao ditas. Sao sentidas.
        </div>
        <IntentPicker />
      </div>
    </main>
  );
}
