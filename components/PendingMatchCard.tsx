"use client";

import { useEffect, useMemo, useState } from "react";
import { getSignedAvatarUrl } from "@/lib/avatar";
import type { ProfileMini, MatchRow } from "@/lib/inbox";
import { useI18n } from "@/components/I18nProvider";

export default function PendingMatchCard({
  match,
  other,
  onAccept,
  onReject,
  busy,
}: {
  match: MatchRow;
  other: ProfileMini | undefined;
  onAccept: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!other?.avatar_path) return;
      try {
        const url = await getSignedAvatarUrl(other.avatar_path);
        if (alive) setAvatarUrl(url);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [other?.avatar_path]);

  const title = useMemo(() => {
    if (!other) return "Utilizador";
    return other.display_name ?? other.username;
  }, [other]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-2xl bg-white/10 overflow-hidden shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium truncate">{title}</div>
            <div className="text-xs text-neutral-400">
              {t("common.expires_in", {
                time: new Date(match.expires_at).toLocaleString(),
              })}
            </div>
          </div>

          <div className="mt-1 text-sm text-neutral-400">
            {t("inbox.pending_prompt")}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={onReject}
              disabled={busy}
              className="rounded-2xl border border-white/10 py-2.5 text-sm hover:border-white/20 disabled:opacity-60"
            >
              {t("inbox.close")}
            </button>
            <button
              onClick={onAccept}
              disabled={busy}
              className="rounded-2xl bg-white text-black py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {busy ? "…" : t("inbox.open")}
            </button>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            {t("inbox.pending_note")}
          </p>
        </div>
      </div>
    </div>
  );
}
