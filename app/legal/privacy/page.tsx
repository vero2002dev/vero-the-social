"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function PrivacyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function accept() {
    setMsg(null);
    setLoading(true);
    try {
      await supabase.rpc("rpc_accept_legal", {
        p_locale: navigator.language,
        p_ip: null,
        p_user_agent: navigator.userAgent,
      });
      router.push("/");
    } catch (e: any) {
      setMsg(e?.message ?? t("legal.accept.error_privacy"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-xs uppercase tracking-[0.3em] text-neutral-500">VERO</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("legal.privacy.title")}</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {t("legal.version")}: 2026-01-23
        </p>

        <div className="mt-8 space-y-4 text-sm text-neutral-300">
          <p>{t("legal.privacy.body1")}</p>
          <p>{t("legal.privacy.body2")}</p>
          <p>{t("legal.privacy.body3")}</p>
        </div>

        {msg ? <div className="mt-6 text-sm text-red-400">{msg}</div> : null}

        <div className="mt-10 flex gap-3">
          <Link
            href="/signup"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
          >
            {t("legal.back")}
          </Link>
          <button
            onClick={accept}
            disabled={loading}
            className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? t("common.accepting") : t("legal.accept.cta")}
          </button>
          <Link
            href="/legal/terms"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
          >
            {t("legal.view_terms")}
          </Link>
        </div>
      </div>
    </main>
  );
}
