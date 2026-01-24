"use client";

import { useEffect, useMemo, useState } from "react";
import { rpcAdminKpis, rpcAdminMetrics, type AdminMetricsRow } from "@/lib/adminMetrics";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function AdminMetricsPage() {
  const [days, setDays] = useState(14);
  const [kpis, setKpis] = useState<any>(null);
  const [rows, setRows] = useState<AdminMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const { t } = useI18n();

  async function load(d = days) {
    setErr(null);
    setLoading(true);
    try {
      const [k, r] = await Promise.all([rpcAdminKpis(d), rpcAdminMetrics(d)]);
      setKpis(k);
      setRows(r);
    } catch (e: any) {
      setErr(e?.message ?? t("common.error_generic"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(days);
  }, [days]);

  const totals = useMemo(() => {
    const t = {
      unlock_success: 0,
      onboarding_done: 0,
      intent_set: 0,
      match_request: 0,
      match_accept: 0,
      chat_send_text: 0,
      invite_create: 0,
      active_users: 0,
    };
    for (const r of rows) {
      t.unlock_success += r.unlock_success;
      t.onboarding_done += r.onboarding_done;
      t.intent_set += r.intent_set;
      t.match_request += r.match_request;
      t.match_accept += r.match_accept;
      t.chat_send_text += r.chat_send_text;
      t.invite_create += r.invite_create;
      t.active_users += r.active_users;
    }
    return t;
  }, [rows]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.metrics.title")}</h1>
            <p className="mt-2 text-sm text-neutral-400">{t("admin.metrics.subtitle")}</p>
          </div>

          <div className="flex gap-2">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
            >
              <option value={7}>{t("admin.metrics.days_7")}</option>
              <option value={14}>{t("admin.metrics.days_14")}</option>
              <option value={30}>{t("admin.metrics.days_30")}</option>
            </select>

            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
              onClick={() => load(days)}
            >
              {t("admin.metrics.update")}
            </button>

            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
              onClick={() => router.push("/invite")}
            >
              {t("admin.metrics.invites")}
            </button>
          </div>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        {loading ? (
          <div className="mt-8 text-sm text-neutral-400">{t("admin.metrics.loading")}</div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title={t("admin.metrics.unlocks")} value={kpis?.unlock_success} sub={t("admin.metrics.kpi.last_days", { days: String(days) })} />
              <KpiCard title={t("admin.metrics.onboard_rate_title")} value={pct(kpis?.onboard_rate)} sub={t("admin.metrics.kpi.onboard_rate")} />
              <KpiCard title={t("admin.metrics.intent_rate_title")} value={pct(kpis?.intent_rate)} sub={t("admin.metrics.kpi.intent_rate")} />
              <KpiCard title={t("admin.metrics.request_rate_title")} value={pct(kpis?.request_rate)} sub={t("admin.metrics.kpi.request_rate")} />
              <KpiCard title={t("admin.metrics.accept_rate_title")} value={pct(kpis?.accept_rate)} sub={t("admin.metrics.kpi.accept_rate")} />
              <KpiCard title={t("admin.metrics.chat_rate_title")} value={pct(kpis?.chat_rate)} sub={t("admin.metrics.kpi.chat_rate")} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-neutral-300">{t("admin.metrics.totals")}</div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <MiniStat label={t("admin.metrics.unlocks")} value={totals.unlock_success} />
                <MiniStat label={t("admin.metrics.onboard")} value={totals.onboarding_done} />
                <MiniStat label={t("admin.metrics.intent")} value={totals.intent_set} />
                <MiniStat label={t("admin.metrics.requests")} value={totals.match_request} />
                <MiniStat label={t("admin.metrics.accepts")} value={totals.match_accept} />
                <MiniStat label={t("admin.metrics.chat_msgs")} value={totals.chat_send_text} />
                <MiniStat label={t("admin.metrics.invites_count")} value={totals.invite_create} />
                <MiniStat label={t("admin.metrics.active_users")} value={totals.active_users} />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left">
                    <th className="p-3">{t("admin.metrics.day")}</th>
                    <th className="p-3">{t("admin.metrics.unlocks")}</th>
                    <th className="p-3">{t("admin.metrics.onboard")}</th>
                    <th className="p-3">{t("admin.metrics.intent")}</th>
                    <th className="p-3">{t("admin.metrics.discover")}</th>
                    <th className="p-3">{t("admin.metrics.req")}</th>
                    <th className="p-3">{t("admin.metrics.acc")}</th>
                    <th className="p-3">{t("admin.metrics.chat")}</th>
                    <th className="p-3">{t("admin.metrics.inv")}</th>
                    <th className="p-3">{t("admin.metrics.active")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.day} className="border-t border-white/10">
                      <td className="p-3 text-neutral-300">{r.day}</td>
                      <td className="p-3">{r.unlock_success}</td>
                      <td className="p-3">{r.onboarding_done}</td>
                      <td className="p-3">{r.intent_set}</td>
                      <td className="p-3">{r.discover_view}</td>
                      <td className="p-3">{r.match_request}</td>
                      <td className="p-3">{r.match_accept}</td>
                      <td className="p-3">{r.chat_send_text}</td>
                      <td className="p-3">{r.invite_create}</td>
                      <td className="p-3">{r.active_users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function KpiCard({ title, value, sub }: { title: string; value: any; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value ?? "—"}</div>
      <div className="mt-2 text-xs text-neutral-500">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 font-medium">{value ?? 0}</div>
    </div>
  );
}

function pct(x: any) {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 1000) / 10}%`;
}
