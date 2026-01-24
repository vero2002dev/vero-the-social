"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function LegalHub() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <AppShell
      title={t("legal.title")}
      right={
        <button
          onClick={() => router.back()}
          className="text-sm text-neutral-300 hover:text-white"
        >
          {t("common.close")}
        </button>
      }
    >
      <div className="grid gap-3">
        <Link
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
          href="/legal/terms"
        >
          {t("legal.terms")}
        </Link>
        <Link
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
          href="/legal/privacy"
        >
          {t("legal.privacy")}
        </Link>
      </div>
    </AppShell>
  );
}
