"use client";

import { useEffect, useState } from "react";
import { getSignedAvatarUrl } from "@/lib/avatar";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function ChatListItem({
  item,
}: {
  item: {
    conversation_id: number;
    other_name: string;
    other_avatar_path: string | null;
    last_text: string | null;
    last_at: string | null;
  };
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!item.other_avatar_path) return;
      try {
        const url = await getSignedAvatarUrl(item.other_avatar_path);
        if (alive) setAvatarUrl(url);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [item.other_avatar_path]);

  return (
    <Link
      href={`/chat/${item.conversation_id}`}
      className="block rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition"
    >
      <div className="flex gap-4 items-center">
        <div className="h-12 w-12 rounded-2xl bg-white/10 overflow-hidden shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium truncate">{item.other_name}</div>
            <div className="text-xs text-neutral-500">
              {item.last_at ? new Date(item.last_at).toLocaleString() : ""}
            </div>
          </div>
          <div className="mt-1 text-sm text-neutral-300 truncate">
            {item.last_text ?? t("chat.list.empty")}
          </div>
        </div>
      </div>
    </Link>
  );
}
