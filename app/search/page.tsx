"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/events";
import { useRouter } from "next/navigation";
import { getMyGateState } from "@/lib/profileGate";
import { useI18n } from "@/components/I18nProvider";

type SearchRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  intent_key: string | null;
  intensity: number | null;
};

export default function SearchPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const g = await getMyGateState();
      if (!g.legalAccepted) router.replace("/legal/terms");
      else if (!g.onboarded) router.replace("/onboarding");
    })();
  }, [router]);

  function formatIntent(k?: string | null) {
    switch (k) {
      case "curiosity":
        return t("intent.curiosity");
      case "connection":
        return t("intent.connection");
      case "desire":
        return t("intent.desire");
      case "private":
        return t("intent.private");
      case "casual":
        return t("intent.casual");
      case "no_labels":
        return t("intent.no_labels");
      default:
        return "—";
    }
  }

  async function runSearch() {
    setMsg(null);
    if (q.trim().length < 2) return setRows([]);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("rpc_search_user", { p_query: q.trim() });
      if (error) throw error;
      setRows((data ?? []) as SearchRow[]);
      await logEvent("search_run", { q: q.trim(), count: (data ?? []).length });
    } catch (e: any) {
      setMsg(e?.message ?? t("search.error"));
    } finally {
      setLoading(false);
    }
  }

  async function request(id: string) {
    await new Promise((r) => setTimeout(r, 800));
    const { error } = await supabase.rpc("rpc_request_match", { p_target: id });
    if (error) return setMsg(error.message);
    await logEvent("match_request", { target: id, via: "search" });
    setMsg(t("search.sent"));
  }

  return (
    <AppShell
      title={t("search.title")}
      right={
        <button onClick={() => router.back()} className="text-sm text-neutral-300 hover:text-white">
          {t("common.close")}
        </button>
      }
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-neutral-300">{t("search.subtitle")}</div>
        <div className="mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={runSearch}
            className="rounded-2xl bg-white text-black py-3 text-sm font-medium"
            disabled={loading}
          >
            {loading ? "..." : t("search.run")}
          </button>
          <button
            onClick={() => {
              setQ("");
              setRows([]);
              setMsg(null);
            }}
            className="rounded-2xl border border-white/10 py-3 text-sm text-neutral-200 hover:border-white/20"
          >
            {t("search.clear")}
          </button>
        </div>

        <div className="mt-3 text-xs text-neutral-500">{t("search.note")}</div>
      </div>

      {msg ? <div className="mt-4 text-sm text-neutral-300">{msg}</div> : null}

      <div className="mt-5 grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium">{r.display_name || r.username}</div>
            <div className="mt-1 text-sm text-neutral-400">@{r.username}</div>
            <div className="mt-3 text-sm text-neutral-200">
              {r.bio?.trim() ? r.bio : <span className="text-neutral-500">{t("search.empty_bio")}</span>}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-neutral-500">
                {formatIntent(r.intent_key)}
                {typeof r.intensity === "number" ? ` · ${r.intensity}/5` : ""}
              </div>
              <button
                onClick={() => request(r.id)}
                className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-medium"
              >
                {t("discover.request")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
