"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiscoverRow } from "@/lib/rpc";
import { getSignedAvatarUrl } from "@/lib/avatar";
import { useI18n } from "@/components/I18nProvider";

export default function ProfileCard({
  row,
  onRequest,
  requesting,
}: {
  row: DiscoverRow;
  onRequest: (id: string) => void;
  requesting?: boolean;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!row.avatar_path) return;
      try {
        const url = await getSignedAvatarUrl(row.avatar_path);
        if (alive) setAvatarUrl(url);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [row.avatar_path]);

  const title = useMemo(() => row.display_name ?? row.username, [row]);

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
              {labelIntent(t, row.intent_key)} {row.intensity ? `· ${row.intensity}/5` : ""}
            </div>
          </div>

          {row.bio ? (
            <div className="mt-1 text-sm text-neutral-300 line-clamp-2">
              {row.bio}
            </div>
          ) : (
            <div className="mt-1 text-sm text-neutral-500">
              {t("discover.card.empty_bio")}
            </div>
          )}

          <button
            onClick={() => onRequest(row.id)}
            disabled={requesting}
            className="mt-4 w-full rounded-2xl bg-white text-black py-2.5 font-medium disabled:opacity-60"
          >
            {requesting ? t("discover.request_sent") : t("discover.request")}
          </button>

          <p className="mt-2 text-xs text-neutral-500">
            {t("discover.card.request_rule")}
          </p>
        </div>
      </div>
    </div>
  );
}

function labelIntent(t: (key: string) => string, key: string | null) {
  switch (key) {
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
