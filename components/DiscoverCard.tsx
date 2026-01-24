"use client";

import { useI18n } from "@/components/I18nProvider";

export default function DiscoverCard({
  displayName,
  username,
  bio,
  intentKey,
  intensity,
  onTap,
}: {
  displayName?: string | null;
  username: string;
  bio?: string | null;
  intentKey?: string | null;
  intensity?: number | null;
  onTap?: () => void;
}) {
  const { t } = useI18n();
  const name = displayName || username;

  return (
    <div
      onClick={onTap}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 w-full shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-2xl font-semibold tracking-tight truncate">{name}</div>
          <div className="mt-1 text-sm text-neutral-400 truncate">@{username}</div>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-white/10 shrink-0" />
      </div>

      <div className="mt-6">
        <div className="text-xs text-neutral-500">{t("discover.card.intent_label")}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-medium">{formatIntent(t, intentKey)}</span>
          {typeof intensity === "number" ? (
            <span className="text-xs text-neutral-400">· {renderDots(intensity)}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-neutral-500">{t("discover.card.line_label")}</div>
        <div className="mt-1 text-sm text-neutral-200 leading-relaxed">
          {bio?.trim() ? bio : <span className="text-neutral-500">{t("discover.card.empty_bio")}</span>}
        </div>
      </div>

      <div className="mt-6 text-xs text-neutral-500">{t("discover.card.request_rule")}</div>
    </div>
  );
}

function renderDots(n: number) {
  const clamped = Math.max(1, Math.min(5, n));
  return "●".repeat(clamped) + "○".repeat(5 - clamped);
}

function formatIntent(t: (key: string) => string, k?: string | null) {
  switch (k) {
    case "curiosity":
      return t("intent.curiosity");
    case "connection":
      return t("intent.connection");
    case "desire":
      return t("intent.desire");
    case "private":
      return t("intent.private");
    case "casual":
      return t("intent.casual");
    case "no_labels":
      return t("intent.no_labels");
    default:
      return "—";
  }
}
