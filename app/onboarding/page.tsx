"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyGateState } from "@/lib/profileGate";
import { useI18n } from "@/components/I18nProvider";

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useI18n();

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
        <h1 className="text-2xl font-semibold tracking-tight">{t("onboarding.title")}</h1>
        <p className="mt-2 text-sm text-neutral-400">{t("onboarding.subtitle")}</p>
        <p className="mt-2 text-xs text-neutral-500">{t("onboarding.note")}</p>
        <button
          className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-medium"
          onClick={() => router.push("/intent")}
        >
          {t("onboarding.cta")}
        </button>
      </div>
    </main>
  );
}
