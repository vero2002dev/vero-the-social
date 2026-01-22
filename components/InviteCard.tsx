"use client";

import { logEvent } from "@/lib/events";

export default function InviteCard({
  code,
  status,
  expiresAt,
}: {
  code: string;
  status: string;
  expiresAt: string;
}) {
  const text = `Tenho um convite para o VERO.\nCodigo: ${code}\n(e por convite, nao e publico)`;

  async function copy() {
    await navigator.clipboard.writeText(text);
    await logEvent("invite_copy");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">Convite</div>
        <div className="text-xs text-neutral-500">{status}</div>
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-widest">{code}</div>

      <div className="mt-2 text-xs text-neutral-500">
        expira: {new Date(expiresAt).toLocaleString()}
      </div>

      <button
        onClick={copy}
        className="mt-4 w-full rounded-2xl bg-white text-black py-2.5 text-sm font-medium"
      >
        Copiar texto
      </button>

      <p className="mt-2 text-xs text-neutral-500">Envia por DM. Nao publiques.</p>
    </div>
  );
}
