"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";

type VerifItem = {
  request: any;
  selfie_photo: any | null;
  profile_photo: any | null;
};

type FlaggedItem = {
  photo: any;
};

export default function AdminReviewPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [verifs, setVerifs] = useState<VerifItem[]>([]);
  const [flagged, setFlagged] = useState<FlaggedItem[]>([]);
  const [tab, setTab] = useState<"verif" | "flagged">("verif");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) return router.replace("/login");
      await load();
    })();
  }, []);

  async function load() {
    setMsg(null);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return router.replace("/login");

    const res = await fetch("/api/admin/review", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json?.error || t("admin.error.generic", { msg: "" }));
      return;
    }

    setVerifs(json.verifications ?? []);
    setFlagged(json.flagged_extras ?? []);
  }

  async function act(action: string, payload: any, key: string) {
    setBusy(key);
    setMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessao invalida");

      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...payload }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Erro");
      await load();
    } catch (e: any) {
      setMsg(e?.message ?? "Erro.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell
      title={t("admin.review.title")}
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

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("verif")}
          className={`rounded-2xl px-4 py-2 text-sm border ${
            tab === "verif"
              ? "bg-white text-black border-white"
              : "border-white/10 text-neutral-300"
          }`}
        >
          {t("admin.review.requests")} ({verifs.length})
        </button>

        <button
          onClick={() => setTab("flagged")}
          className={`rounded-2xl px-4 py-2 text-sm border ${
            tab === "flagged"
          
              ? "bg-white text-black border-white"
              : "border-white/10 text-neutral-300"
          }`}
        >
          {t("admin.review.photos")} ({flagged.length})
        </button>

        <button
          onClick={load}
          className="ml-auto rounded-2xl px-4 py-2 text-sm border border-white/10 text-neutral-200 hover:border-white/20"
        >
          {t("common.update")}
        </button>
      </div>

      {tab === "verif" ? (
        verifs.length === 0 ? (
          <EmptyCard title={t("admin.review.empty")} />
        ) : (
          <div className="grid gap-4">
            {verifs.map((it) => {
              const r = it.request;
              const key = `verif-${r.id}`;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-neutral-400">User</div>
                      <div className="text-sm font-medium break-all">
                        {r.user_id}
                      </div>
                      <div className="mt-2 text-xs text-neutral-500">
                        Tipo: {r.type} · {t("admin.review.challenge")}: {r.challenge_code}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <ImageBox
                      label="Selfie verify"
                      url={it.selfie_photo?.signed_url}
                    />
                    <ImageBox
                      label="Profile (pending)"
                      url={it.profile_photo?.signed_url}
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={busy === key}
                      onClick={() =>
                        act("approve_verification", { request_id: r.id }, key)
                      }
                      className="flex-1 rounded-2xl bg-white text-black py-2 text-sm font-medium disabled:opacity-60"
                    >
                      {t("admin.approve")}
                    </button>

                    <button
                      disabled={busy === key}
                      onClick={() => {
                        const reason =
                          prompt("Motivo (opcional):", "failed") || "failed";
                        act(
                          "reject_verification",
                          { request_id: r.id, reason },
                          key
                        );
                      }}
                      className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/10 py-2 text-sm text-red-200 disabled:opacity-60"
                    >
                      {t("admin.reject")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : flagged.length === 0 ? (
        <EmptyCard title={t("admin.review.empty")} />
      ) : (
        <div className="grid gap-4">
          {flagged.map((it) => {
            const p = it.photo;
            const key = `photo-${p.id}`;
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-neutral-400">User</div>
                    <div className="text-sm font-medium break-all">
                      {p.user_id}
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">
                      {t("admin.review.risk")}: {p.risk_score} · {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <ImageBox label="Extra" url={p.signed_url} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    disabled={busy === key}
                    onClick={() =>
                      act("approve_flagged_extra", { photo_id: p.id }, key)
                    }
                    className="rounded-2xl bg-white text-black py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {t("admin.approve")}
                  </button>

                  <button
                    disabled={busy === key}
                    onClick={() => {
                      const reason =
                        prompt("Motivo (mismatch / spam / etc.):", "mismatch") ||
                        "mismatch";

                      const strike =
                        confirm("Conta como strike? (3 strikes = ban)") === true;

                      act(
                        "reject_flagged_extra",
                        { photo_id: p.id, reason, strike },
                        key
                      );
                    }}
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 py-2 text-sm text-red-200 disabled:opacity-60"
                  >
                    {t("admin.reject")}
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-neutral-500">
                  Reject com strike so quando tens certeza.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function EmptyCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-neutral-400">
        Quando houver items, aparecem aqui.
      </div>
    </div>
  );
}

function ImageBox({ label, url }: { label: string; url?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs text-neutral-500 mb-2">{label}</div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          className="w-full h-48 object-cover rounded-xl border border-white/10"
        />
      ) : (
        <div className="w-full h-48 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-neutral-500">
          sem imagem
        </div>
      )}
    </div>
  );
}
