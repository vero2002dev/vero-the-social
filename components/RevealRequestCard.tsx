"use client";

import { useEffect, useState } from "react";
import type { RevealRow } from "@/lib/reveals";
import { fetchProfilesMini } from "@/lib/inbox";
import { getSignedAvatarUrl } from "@/lib/avatar";

export default function RevealRequestCard({
  reveal,
  onAccept,
  onReject,
  busy,
}: {
  reveal: RevealRow;
  onAccept: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  const [name, setName] = useState("Utilizador");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p] = await fetchProfilesMini([reveal.from_user]);
      if (!alive) return;
      if (p) {
        setName(p.display_name ?? p.username);
        if (p.avatar_path) {
          try {
            const url = await getSignedAvatarUrl(p.avatar_path);
            if (alive) setAvatarUrl(url);
          } catch {
            // ignore
          }
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [reveal.from_user]);

  const kindLabel = reveal.kind === "media" ? "Media (imagens)" : "Perfil";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white/10 overflow-hidden shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium truncate">{name}</div>
            <div className="text-xs text-neutral-500">
              expira: {new Date(reveal.expires_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-1 text-sm text-neutral-300">
            Pedido de reveal: <span className="text-white">{kindLabel}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={onReject}
              disabled={busy}
              className="rounded-2xl border border-white/10 py-2.5 text-sm hover:border-white/20 disabled:opacity-60"
            >
              Rejeitar
            </button>
            <button
              onClick={onAccept}
              disabled={busy}
              className="rounded-2xl bg-white text-black py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {busy ? "…" : "Aceitar"}
            </button>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            Consentimento explicito. Sem pressao.
          </p>
        </div>
      </div>
    </div>
  );
}
