"use client";

import { useI18n } from "@/components/I18nProvider";

export default function SignalsList({
  signals,
  me,
}: {
  signals: {
    id: number;
    author: string;
    text?: string | null;
    image_path?: string | null;
    created_at: string;
  }[];
  me: string;
}) {
  const { t } = useI18n();
  if (!signals.length) return null;

  return (
    <div className="mb-4 space-y-3">
      <div className="text-xs text-neutral-500">{t("chat.signals.title")}</div>
      {signals.map((s) => (
        <div
          key={s.id}
          className={`rounded-2xl p-3 border ${
            s.author === me ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"
          }`}
        >
          {s.text ? <div className="text-sm">{s.text}</div> : null}
          {s.image_path ? <div className="mt-2 rounded-xl bg-white/10 h-32" /> : null}
          <div className="mt-1 text-[11px] text-neutral-500">
            {new Date(s.created_at).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
