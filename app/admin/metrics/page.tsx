"use client";

import { useEffect, useMemo, useState } from "react";
import { rpcAdminKpis, rpcAdminMetrics, type AdminMetricsRow } from "@/lib/adminMetrics";
import { useRouter } from "next/navigation";

export default function AdminMetricsPage() {
  const [days, setDays] = useState(14);
  const [kpis, setKpis] = useState<any>(null);
  const [rows, setRows] = useState<AdminMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function load(d = days) {
    setErr(null);
    setLoading(true);
    try {
      const [k, r] = await Promise.all([rpcAdminKpis(d), rpcAdminMetrics(d)]);
      setKpis(k);
      setRows(r);
    } catch (e: any) {
      setErr(e?.message ?? "Erro a carregar metricas.");
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
            <h1 className="text-2xl font-semibold tracking-tight">Admin · Metricas</h1>
            <p className="mt-2 text-sm text-neutral-400">Funil real. Sem adivinhar.</p>
          </div>

          <div className="flex gap-2">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
            >
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
              <option value={30}>30 dias</option>
            </select>

            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
              onClick={() => load(days)}
            >
              Atualizar
            </button>

            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
              onClick={() => router.push("/invite")}
            >
              Convites
            </button>
          </div>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        {loading ? (
          <div className="mt-8 text-sm text-neutral-400">A carregar...</div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title="Unlocks" value={kpis?.unlock_success} sub={`ultimos ${days} dias`} />
              <KpiCard title="Onboard rate" value={pct(kpis?.onboard_rate)} sub="onboarding_done / unlock_success" />
              <KpiCard title="Intent rate" value={pct(kpis?.intent_rate)} sub="intent_set / onboarding_done" />
              <KpiCard title="Request rate" value={pct(kpis?.request_rate)} sub="match_request / intent_set" />
              <KpiCard title="Accept rate" value={pct(kpis?.accept_rate)} sub="match_accept / match_request" />
              <KpiCard title="Chat rate" value={pct(kpis?.chat_rate)} sub="chat_send_text / match_accept" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-neutral-300">Totais (somados por dia)</div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <MiniStat label="Unlock" value={totals.unlock_success} />
                <MiniStat label="Onboard" value={totals.onboarding_done} />
                <MiniStat label="Intent" value={totals.intent_set} />
                <MiniStat label="Requests" value={totals.match_request} />
                <MiniStat label="Accepts" value={totals.match_accept} />
                <MiniStat label="Chat msgs" value={totals.chat_send_text} />
                <MiniStat label="Invites" value={totals.invite_create} />
                <MiniStat label="Active users" value={totals.active_users} />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left">
                    <th className="p-3">Dia</th>
                    <th className="p-3">Unlock</th>
                    <th className="p-3">Onboard</th>
                    <th className="p-3">Intent</th>
                    <th className="p-3">Discover</th>
                    <th className="p-3">Req</th>
                    <th className="p-3">Acc</th>
                    <th className="p-3">Chat</th>
                    <th className="p-3">Inv</th>
                    <th className="p-3">Active</th>
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
