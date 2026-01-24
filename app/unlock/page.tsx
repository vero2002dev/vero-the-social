"use client";

import { useEffect, useState } from "react";
import { rpcClaimInvite, rpcUsage } from "@/lib/invites";
import { useRouter } from "next/navigation";
import { setUnlockedCookie } from "@/lib/verificationCookies";
import { logEvent } from "@/lib/events";
import { useI18n } from "@/components/I18nProvider";

export default function UnlockPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

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
      setErr(e?.message ?? t("unlock.invalid"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-start justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("unlock.title")}</h1>
        <p className="mt-2 text-sm text-neutral-400">{t("unlock.subtitle")}</p>
        <p className="mt-2 text-xs text-neutral-500">
          {t("tone.rules_felt")}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          {t("tone.legend_phrase")}
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("unlock.code_placeholder")}
          className="mt-6 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
        />

        {err && <div className="mt-3 text-sm text-red-400">{err}</div>}

        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-white text-black py-3 font-medium disabled:opacity-60"
        >
          {loading ? t("common.validating") : t("unlock.cta")}
        </button>

        <p className="mt-3 text-xs text-neutral-500">
          {t("tone.invite_intentional")}
        </p>
      </div>
    </main>
  );
}
