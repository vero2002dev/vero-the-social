"use client";

import { logEvent } from "@/lib/events";
import { useI18n } from "@/components/I18nProvider";

export default function InviteCard({
  code,
  status,
  expiresAt,
}: {
  code: string;
  status: string;
  expiresAt: string;
}) {
  const { t } = useI18n();
  const text = t("invite.card.copy_text", { code });

  async function copy() {
    await navigator.clipboard.writeText(text);
    await logEvent("invite_copy");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{t("invite.card.title")}</div>
        <div className="text-xs text-neutral-500">{status}</div>
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-widest">{code}</div>

      <div className="mt-2 text-xs text-neutral-500">
        {t("invite.card.expires", { time: new Date(expiresAt).toLocaleString() })}
      </div>

      <button
        onClick={copy}
        className="mt-4 w-full rounded-2xl bg-white text-black py-2.5 text-sm font-medium"
      >
        {t("invite.card.copy_button")}
      </button>

      <p className="mt-2 text-xs text-neutral-500">{t("invite.card.note")}</p>
    </div>
  );
}
