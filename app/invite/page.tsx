"use client";

import { useEffect, useState } from "react";
import { fetchMyInvites, rpcCreateInvite, rpcUsage } from "@/lib/invites";
import InviteCard from "@/components/InviteCard";
import { useRouter } from "next/navigation";
import { logEvent } from "@/lib/events";
import { useI18n } from "@/components/I18nProvider";

export default function InvitePage() {
  const { t } = useI18n();
  const [usage, setUsage] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const u = await rpcUsage();
      setUsage(u);
      // invites available for all logged-in users
      const list = await fetchMyInvites();
      setInvites(list);
    } catch (e: any) {
      setErr(e?.message ?? t("invite.error_load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setErr(null);
    setCreating(true);
    try {
      if ((usage?.plan ?? "free") !== "premium" && (usage?.invite_week_remaining ?? 0) <= 0) {
        setErr(t("invite.paywall"));
        router.push("/premium");
        return;
      }
      await rpcCreateInvite();
      await logEvent("invite_create");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? t("invite.error_create"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("invite.title")}</h1>
            <p className="mt-2 text-sm text-neutral-400">
              {t("invite.subtitle")}
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
            onClick={() => router.push("/premium")}
          >
            Premium
          </button>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        {loading ? (
          <div className="mt-6 text-sm text-neutral-400">{t("invite.loading")}</div>
        ) : (
          <>
            {(usage?.plan ?? "free") !== "premium" && (usage?.invite_week_remaining ?? 0) <= 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                {t("invite.paywall")}
                <button
                  className="mt-3 w-full rounded-2xl bg-white text-black py-2.5 text-sm font-medium"
                  onClick={() => router.push("/premium")}
                >
                  {t("invite.activate")}
                </button>
              </div>
            ) : null}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-300">{t("invite.remaining_week")}</div>
                <div className="text-sm text-neutral-100 font-medium">
                  {usage?.invite_week_remaining}/{usage?.invite_week_limit}
                </div>
              </div>

              <button
                onClick={create}
                disabled={creating || usage?.invite_week_remaining <= 0}
                className="mt-4 w-full rounded-2xl bg-white text-black py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {creating ? t("invite.creating") : t("invite.create")}
              </button>

              <p className="mt-2 text-xs text-neutral-500">
                {t("invite.rules")}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                {t("invite.regen")}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              {invites.map((i) => (
                <InviteCard
                  key={i.id}
                  code={i.code}
                  status={i.status}
                  expiresAt={i.expires_at}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
