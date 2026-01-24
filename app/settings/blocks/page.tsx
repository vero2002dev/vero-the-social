"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { getMyGateState } from "@/lib/profileGate";
import { useI18n } from "@/components/I18nProvider";

type BlockRow = { blocked: string; created_at: string };

export default function BlocksPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BlockRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { t } = useI18n();

  async function load() {
    setMsg(null);
    const { data, error } = await supabase
      .from("blocks")
      .select("blocked,created_at")
      .order("created_at", { ascending: false });

    if (error) return setMsg(error.message);
    setRows((data ?? []) as BlockRow[]);
  }

  useEffect(() => {
    (async () => {
      try {
        const g = await getMyGateState();
        if (!g.legalAccepted) return router.replace("/legal/terms");
        if (!g.unlocked) return router.replace("/unlock");
        if (!g.onboarded) return router.replace("/onboarding");
        await load();
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  async function unblock(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const { error } = await supabase.rpc("rpc_unblock_user", {
        p_blocked: id,
      });
      if (error) throw error;
      await load();
      setMsg(t("common.unblocked"));
    } catch (e: any) {
      setMsg(e?.message ?? t("common.error_generic"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell
      title={t("settings.blocks")}
      right={
        <button
          onClick={() => router.back()}
          className="text-sm text-neutral-300 hover:text-white"
        >
          {t("common.close")}
        </button>
      }
    >
      <Toast text={msg} onClose={() => setMsg(null)} />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">{t("settings.blocks_empty")}</div>
          <div className="mt-2 text-sm text-neutral-400">
            {t("settings.blocks_empty_sub")}
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div
              key={r.blocked}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.blocked}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => unblock(r.blocked)}
                disabled={busy === r.blocked}
                className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-neutral-200 hover:border-white/20 disabled:opacity-60"
              >
                {t("common.unblock")}
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
