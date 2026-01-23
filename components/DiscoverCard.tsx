"use client";

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
        <div className="text-xs text-neutral-500">INTENCAO</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-medium">{formatIntent(intentKey)}</span>
          {typeof intensity === "number" ? (
            <span className="text-xs text-neutral-400">· {renderDots(intensity)}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-neutral-500">LINHA</div>
        <div className="mt-1 text-sm text-neutral-200 leading-relaxed">
          {bio?.trim() ? bio : <span className="text-neutral-500">Sem bio. So presenca.</span>}
        </div>
      </div>

      <div className="mt-6 text-xs text-neutral-500">Se pedires entrada, tens 48h.</div>
    </div>
  );
}

function renderDots(n: number) {
  const clamped = Math.max(1, Math.min(5, n));
  return "●".repeat(clamped) + "○".repeat(5 - clamped);
}

function formatIntent(k?: string | null) {
  switch (k) {
    case "curiosity":
      return "Curiosidade";
    case "connection":
      return "Conexao";
    case "desire":
      return "Desejo";
    case "private":
      return "Privado";
    case "casual":
      return "Casual";
    case "no_labels":
      return "Sem rotulos";
    default:
      return "—";
  }
}
