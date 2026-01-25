"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";

export default function UnlockPage() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) router.replace("/onboarding");
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-start justify-center">
      <div className="w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("unlock.title")}
          </h1>
          <button
            className="text-sm text-neutral-300 hover:text-white"
            onClick={() => router.replace("/login")}
          >
            {t("profile.logout")}
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          {t("unlock.public_launch")}
        </p>
        <div className="mt-6 grid gap-3">
          <button
            className="w-full rounded-2xl bg-white text-black py-3 font-medium"
            onClick={() => router.push("/login")}
          >
            {t("auth.login")}
          </button>
          <button
            className="w-full rounded-2xl border border-white/10 py-3 text-sm text-neutral-200 hover:border-white/20"
            onClick={() => router.push("/signup")}
          >
            {t("auth.signup")}
          </button>
        </div>
      </div>
    </main>
  );
}
