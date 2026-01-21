"use client";

import Link from "next/link";

export default function PromocoesPage() {
  return (
    <main className="grid gap-8 max-w-4xl">
      <div className="rounded-[28px] border border-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promocoes</div>
        <h1 className="mt-3 text-4xl font-semibold">Promo do Perfil</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Impulsiona o teu perfil para aparecer mais vezes e mais acima no VERO.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
            Promover agora
          </button>
          <button className="rounded-full border border-border px-5 py-2 text-sm">
            Ver resultados
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-sm font-semibold">Como funciona</div>
          <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
            <p>O teu perfil ganha destaque nas areas principais.</p>
            <p>Mais pessoas veem o teu perfil e clicam para conhecer-te.</p>
            <p>Controlo total: pausar, reativar ou terminar quando quiseres.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-sm font-semibold">Precos</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Boost rapida
              </div>
              <div className="mt-2 text-2xl font-semibold">4,99€</div>
              <div className="text-xs text-muted-foreground">24 horas de destaque</div>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Boost semana
              </div>
              <div className="mt-2 text-2xl font-semibold">9,99€</div>
              <div className="text-xs text-muted-foreground">7 dias de destaque</div>
            </div>
          </div>
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
