"use client";

import { useEffect, useState } from "react";
import { rpcUsage } from "@/lib/invites";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function PremiumPage() {
  const [u, setU] = useState<any>(null);
  const router = useRouter();
  const { t } = useI18n();

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
        <h1 className="text-2xl font-semibold tracking-tight">{t("premium.title")}</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {t("premium.subtitle")}
        </p>
        <p className="mt-2 text-xs text-neutral-500">{t("premium.subtle")}</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">{t("premium.discover_day")}</span>
            <span className="text-neutral-100 font-medium">8</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">{t("premium.match_day")}</span>
            <span className="text-neutral-100 font-medium">10</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">{t("premium.invite_week")}</span>
            <span className="text-neutral-100 font-medium">5</span>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs text-neutral-500">
            {t("premium.footer")}
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-medium"
          onClick={() => alert("Billing em breve (MVP).")}
        >
          {t("premium.cta")}
        </button>

        <button
          className="mt-3 w-full rounded-2xl border border-white/10 py-3 text-sm hover:border-white/20"
          onClick={() => router.push("/invite")}
        >
          {t("premium.back")}
        </button>

        <p className="mt-4 text-xs text-neutral-500">
          {t("premium.plan")}: {u?.plan ?? "—"}
        </p>
      </div>
    </main>
  );
}
