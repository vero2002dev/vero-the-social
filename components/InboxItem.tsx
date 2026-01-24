"use client";

import { useI18n } from "@/components/I18nProvider";

export default function InboxItem({
  title,
  subtitle,
  expiresIn,
  onAccept,
  onReject,
  busy,
}: {
  title: string;
  subtitle?: string | null;
  expiresIn?: string | null;
  onAccept: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium truncate">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-neutral-400">{subtitle}</div> : null}
          {expiresIn ? (
            <div className="mt-2 text-xs text-neutral-500">
              {t("common.expires_in", { time: expiresIn })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={onReject}
          disabled={busy}
          className="rounded-2xl border border-white/10 py-2.5 text-sm text-neutral-200 hover:border-white/20 disabled:opacity-60"
        >
          {t("inbox.close")}
        </button>
        <button
          onClick={onAccept}
          disabled={busy}
          className="rounded-2xl bg-white text-black py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {t("inbox.open")}
        </button>
      </div>
    </div>
  );
}
