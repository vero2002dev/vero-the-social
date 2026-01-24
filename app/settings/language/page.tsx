"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { getMyGateState } from "@/lib/profileGate";
import { useI18n } from "@/components/I18nProvider";

const options = [
  { code: "pt-PT", label: "Portugues (PT)" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
  { code: "fr", label: "Francais" },
];

export default function LanguagePage() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<string>("pt-PT");
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      try {
        const g = await getMyGateState();
        if (!g.legalAccepted) return router.replace("/legal/terms");
        if (!g.unlocked) return router.replace("/unlock");
        if (!g.onboarded) return router.replace("/onboarding");

        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return router.replace("/login");

        const { data, error } = await supabase
          .from("profiles")
          .select("locale")
          .eq("id", uid)
          .single();
        if (!error && data?.locale) setCurrent(data.locale);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  async function setLocale(code: string) {
    setBusy(true);
    setMsg(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
        if (!uid) throw new Error(t("common.session_invalid"));

      const { error } = await supabase
        .from("profiles")
        .update({ locale: code })
        .eq("id", uid);
      if (error) throw error;

      setCurrent(code);
      setMsg(t("settings.language_updated"));
    } catch (e: any) {
      setMsg(e?.message ?? t("common.error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title={t("settings.language")}
      right={
        <button
          onClick={() => router.back()}
          className="text-sm text-neutral-300 hover:text-white"
        >
          {t("common.close")}
        </button>
      }
    >
      <Toast text={msg} onClose={() => setMsg(null)} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-neutral-300">{t("settings.language_choose")}</div>
        <div className="mt-3 grid gap-2">
          {options.map((o) => {
            const active = o.code === current;
            return (
              <button
                key={o.code}
                disabled={busy}
                onClick={() => setLocale(o.code)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                  active
                    ? "bg-white text-black border-white"
                    : "border-white/10 bg-black/20 text-neutral-200 hover:border-white/20"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
