"use client";

import Link from "next/link";

export default function SubscricaoPage() {
  return (
    <main className="grid gap-8 max-w-5xl">
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] p-8">
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Subscricao</div>
        <h1 className="mt-3 text-4xl font-semibold">Boosts & Discover+</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Subscricao mensal feita para aumentar visibilidade no Discover e ganhar matches mais rapido.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
            Comecar subscricao
          </button>
          <button className="rounded-full border border-border px-5 py-2 text-sm">
            Comparar planos
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Starter</div>
          <div className="mt-2 text-3xl font-semibold">7,99€</div>
          <div className="text-xs text-muted-foreground">por mes</div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>1 boost por semana</li>
            <li>Likes prioritarios basicos</li>
            <li>Perfil destacado 2x</li>
          </ul>
          <button className="mt-5 w-full rounded-full border border-border px-4 py-2 text-sm">
            Escolher Starter
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pro</div>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Mais vendido
            </span>
          </div>
          <div className="mt-2 text-3xl font-semibold">14,99€</div>
          <div className="text-xs text-muted-foreground">por mes</div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>3 boosts por semana</li>
            <li>Likes prioritarios no Discover</li>
            <li>Perfil destacado 4x</li>
          </ul>
          <button className="mt-5 w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
            Escolher Pro
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Elite</div>
          <div className="mt-2 text-3xl font-semibold">24,99€</div>
          <div className="text-xs text-muted-foreground">por mes</div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>Boosts diarios</li>
            <li>Likes prioritarios maximos</li>
            <li>Perfil destacado 8x</li>
          </ul>
          <button className="mt-5 w-full rounded-full border border-border px-4 py-2 text-sm">
            Escolher Elite
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-6">
        <div className="text-sm font-semibold">Planos e benefits</div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Benefit</th>
                <th className="py-2 pr-4">Starter</th>
                <th className="py-2 pr-4">Pro</th>
                <th className="py-2 pr-4">Elite</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">Boosts semanais</td>
                <td className="py-3 pr-4">1</td>
                <td className="py-3 pr-4">3</td>
                <td className="py-3 pr-4">7</td>
              </tr>
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">Prioridade no Discover</td>
                <td className="py-3 pr-4">Media</td>
                <td className="py-3 pr-4">Alta</td>
                <td className="py-3 pr-4">Maxima</td>
              </tr>
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">Visibilidade em matches</td>
                <td className="py-3 pr-4">2x</td>
                <td className="py-3 pr-4">4x</td>
                <td className="py-3 pr-4">8x</td>
              </tr>
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">Likes prioritarios</td>
                <td className="py-3 pr-4">Basico</td>
                <td className="py-3 pr-4">Pro</td>
                <td className="py-3 pr-4">Elite</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <Link href="/" className="underline">
          Voltar a Home
        </Link>
      </div>
    </main>
  );
}
