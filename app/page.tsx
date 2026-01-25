"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyGateState } from "@/lib/profileGate";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const g = await getMyGateState();
      if (!g.legalAccepted) router.replace("/legal/terms");
      else if (!g.onboarded) router.replace("/onboarding");
      else router.replace("/discover");
    })();
  }, [router]);

  return null;
}
