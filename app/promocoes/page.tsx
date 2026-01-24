"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function PromocoesPage() {
  const { t } = useI18n();

  return (
    <main className="grid gap-8 max-w-4xl">
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("promo.kicker")}</div>
        <h1 className="mt-3 text-4xl font-semibold">{t("promo.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("promo.subtitle")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
            {t("promo.cta.primary")}
          </button>
          <button className="rounded-full border border-border px-5 py-2 text-sm">
            {t("promo.cta.secondary")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-sm font-semibold">{t("promo.how.title")}</div>
          <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
            <p>{t("promo.how.item1")}</p>
            <p>{t("promo.how.item2")}</p>
            <p>{t("promo.how.item3")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-sm font-semibold">{t("promo.prices.title")}</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t("promo.boost.fast")}
              </div>
              <div className="mt-2 text-2xl font-semibold">4,99€</div>
              <div className="text-xs text-muted-foreground">{t("promo.boost.fast.detail")}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("promo.boost.week")}
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("common.best_seller")}
                </span>
              </div>
              <div className="mt-2 text-2xl font-semibold">9,99€</div>
              <div className="text-xs text-muted-foreground">{t("promo.boost.week.detail")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <Link href="/" className="underline">
          {t("common.back_home")}
        </Link>
      </div>
    </main>
  );
}
