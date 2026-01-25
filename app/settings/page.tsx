"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import ProfileTile from "@/components/ProfileTile";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { getMyGateState } from "@/lib/profileGate";
import { useI18n } from "@/components/I18nProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const g = await getMyGateState();
        if (!g.legalAccepted) return router.replace("/legal/terms");
        if (!g.onboarded) return router.replace("/onboarding");
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  async function exportData() {
    setBusy(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.rpc("rpc_export_my_data");
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vero-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMsg(t("settings.export.done"));
    } catch (e: any) {
      setMsg(e?.message ?? t("settings.export.fail"));
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    const ok = confirm(t("settings.delete.confirm"));
    if (!ok) return;

    setBusy(true);
    setMsg(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error(t("settings.session_invalid"));

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || t("settings.delete.fail"));
      }

      await supabase.auth.signOut();
      router.replace("/signup");
    } catch (e: any) {
      setMsg(e?.message ?? t("settings.delete.fail"));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setMsg(null);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title={t("settings.title")}
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

      <div className="grid gap-3">
        <ProfileTile
          title={t("settings.language")}
          subtitle={t("settings.language_sub")}
          href="/settings/language"
        />
        <ProfileTile
          title={t("settings.blocks")}
          subtitle={t("settings.blocks_sub")}
          href="/settings/blocks"
        />
        <ProfileTile
          title={t("settings.legal")}
          subtitle={t("settings.legal_sub")}
          href="/legal"
        />
      </div>

      <div className="mt-6">
        <div className="text-xs text-neutral-500 mb-2">{t("settings.data")}</div>
        <div className="grid gap-3">
          <ProfileTile
            title={t("settings.export")}
            subtitle={t("settings.export_sub")}
            onClick={busy ? undefined : exportData}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-neutral-500 mb-2">{t("settings.account")}</div>
        <div className="grid gap-3">
          <ProfileTile
            title={t("settings.logout")}
            subtitle={t("settings.logout_sub")}
            onClick={busy ? undefined : logout}
          />
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="font-medium text-red-200">{t("settings.danger")}</div>
            <div className="mt-1 text-sm text-red-200/70">
              {t("settings.delete_irreversible")}
            </div>
            <button
              onClick={busy ? undefined : deleteAccount}
              className="mt-4 w-full rounded-2xl bg-red-500 text-white py-3 text-sm font-medium disabled:opacity-60"
              disabled={busy}
            >
              {t("settings.delete")}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
