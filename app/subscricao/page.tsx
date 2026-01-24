"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function SubscricaoPage() {
  const { t } = useI18n();

  return (
    <main className="grid gap-8 max-w-5xl">
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] p-8">
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("sub.kicker")}</div>
        <h1 className="mt-3 text-4xl font-semibold">{t("sub.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("sub.subtitle")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
            {t("sub.cta.primary")}
          </button>
          <button className="rounded-full border border-border px-5 py-2 text-sm">
            {t("sub.cta.secondary")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("sub.plan.starter")}</div>
          <div className="mt-2 text-3xl font-semibold">7,99€</div>
          <div className="text-xs text-muted-foreground">{t("common.per_month")}</div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>{t("sub.starter.item1")}</li>
            <li>{t("sub.starter.item2")}</li>
            <li>{t("sub.starter.item3")}</li>
          </ul>
          <button className="mt-5 w-full rounded-full border border-border px-4 py-2 text-sm">
            {t("sub.choose.starter")}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("sub.plan.pro")}</div>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("common.best_seller")}
            </span>
          </div>
          <div className="mt-2 text-3xl font-semibold">14,99€</div>
          <div className="text-xs text-muted-foreground">{t("common.per_month")}</div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>{t("sub.pro.item1")}</li>
            <li>{t("sub.pro.item2")}</li>
            <li>{t("sub.pro.item3")}</li>
          </ul>
          <button className="mt-5 w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
            {t("sub.choose.pro")}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("sub.plan.elite")}</div>
          <div className="mt-2 text-3xl font-semibold">24,99€</div>
          <div className="text-xs text-muted-foreground">{t("common.per_month")}</div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>{t("sub.elite.item1")}</li>
            <li>{t("sub.elite.item2")}</li>
            <li>{t("sub.elite.item3")}</li>
          </ul>
          <button className="mt-5 w-full rounded-full border border-border px-4 py-2 text-sm">
            {t("sub.choose.elite")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-6">
        <div className="text-sm font-semibold">{t("sub.table.title")}</div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">{t("sub.table.benefit")}</th>
                <th className="py-2 pr-4">{t("sub.plan.starter")}</th>
                <th className="py-2 pr-4">{t("sub.plan.pro")}</th>
                <th className="py-2 pr-4">{t("sub.plan.elite")}</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">{t("sub.table.row1")}</td>
                <td className="py-3 pr-4">1</td>
                <td className="py-3 pr-4">3</td>
                <td className="py-3 pr-4">7</td>
              </tr>
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">{t("sub.table.row2")}</td>
                <td className="py-3 pr-4">{t("sub.table.priority.medium")}</td>
                <td className="py-3 pr-4">{t("sub.table.priority.high")}</td>
                <td className="py-3 pr-4">{t("sub.table.priority.max")}</td>
              </tr>
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">{t("sub.table.row3")}</td>
                <td className="py-3 pr-4">2x</td>
                <td className="py-3 pr-4">4x</td>
                <td className="py-3 pr-4">8x</td>
              </tr>
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">{t("sub.table.row4")}</td>
                <td className="py-3 pr-4">{t("sub.table.likes.basic")}</td>
                <td className="py-3 pr-4">{t("sub.plan.pro")}</td>
                <td className="py-3 pr-4">{t("sub.plan.elite")}</td>
              </tr>
            </tbody>
          </table>
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
