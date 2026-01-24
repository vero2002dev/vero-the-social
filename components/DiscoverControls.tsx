"use client";

import { useI18n } from "@/components/I18nProvider";

export default function DiscoverControls({
  onPass,
  onRequest,
  disabled,
}: {
  onPass: () => void;
  onRequest: () => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button
        onClick={onPass}
        disabled={disabled}
        className="rounded-2xl border border-white/10 py-3 text-sm text-neutral-200 hover:border-white/20 disabled:opacity-60"
      >
        {t("discover.pass")}
      </button>

      <button
        onClick={onRequest}
        disabled={disabled}
        className="rounded-2xl bg-white text-black py-3 text-sm font-medium disabled:opacity-60"
      >
        {t("discover.request")}
      </button>
    </div>
  );
}
