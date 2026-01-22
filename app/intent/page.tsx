"use client";

import IntentPicker from "@/components/IntentPicker";
import { useEffect } from "react";
import { rpcUsage } from "@/lib/invites";
import { useRouter } from "next/navigation";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import { logEvent } from "@/lib/events";

export default function IntentPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const usage = await rpcUsage();
        setUnlockedCookie(!!usage.unlocked);
        if (!usage.unlocked) {
          router.push("/unlock");
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
      <IntentPicker />
    </main>
  );
}
