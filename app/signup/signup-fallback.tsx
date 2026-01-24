"use client";

import { useI18n } from "@/components/I18nProvider";

export default function SignupFallback() {
  const { t } = useI18n();
  return (
    <main className="auth-page">
      <div className="auth-shell">{t("common.loading")}</div>
    </main>
  );
}
