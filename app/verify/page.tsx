"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";

type VerReq = {
  id: string;
  type: "initial" | "profile_change";
  status: "pending" | "approved" | "rejected" | "cancelled";
  challenge_code: string;
  created_at: string;
};

type Status = "unverified" | "pending" | "verified" | "failed";

export default function VerifyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [req, setReq] = useState<VerReq | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("pending");

  const title = useMemo(() => {
    if (!req) return t("verify.title");
    return req.type === "profile_change" ? t("verify.reverify_title") : t("verify.title");
  }, [req, t]);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return router.replace("/login");

        const { data: pRow } = await supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", auth.user.id)
          .maybeSingle();
        setStatus((pRow?.verification_status as Status) ?? "unverified");

        await loadLatestPending();
      } catch (e: any) {
        setMsg(e?.message ?? t("common.error_generic"));
      }
    })();
  }, [router, t]);

  useEffect(() => {
    if (status === "verified") router.replace("/feed");
  }, [router, status]);

  async function loadLatestPending() {
    setMsg(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    const { data, error } = await supabase
      .from("verification_requests")
      .select("id,type,status,challenge_code,created_at")
      .eq("user_id", uid)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setMsg(error.message);
      return;
    }

    setReq((data as VerReq) ?? null);
  }

  async function uploadSelfie() {
    if (!req || req.status !== "pending") return setMsg(t("verify.need_request"));
    if (!selfieFile) return setMsg(t("verify.pick_selfie"));

    setBusy(true);
    setMsg(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error(t("verify.no_session"));

      const path = `user/${uid}/verify/${req.id}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("private_media")
        .upload(path, selfieFile, {
          upsert: true,
          contentType: selfieFile.type || "image/jpeg",
        });

      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("profile_photos").insert({
        user_id: uid,
        kind: "selfie_verify",
        storage_path: path,
        status: "pending",
        meta: { request_id: req.id, source: "camera" },
      });

      if (insErr) throw insErr;

      setMsg(t("verify.sent"));
      setSelfieFile(null);
      setStatus("pending");
    } catch (e: any) {
      setMsg(e?.message ?? t("verify.error.generic", { msg: "" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title={title}
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

      {!req ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">{t("verify.need_request_title")}</div>
          <div className="mt-2 text-sm text-neutral-400">{t("verify.need_request_body")}</div>
          <button
            onClick={() => router.replace("/profile")}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 py-3 text-sm text-neutral-200"
          >
            {t("verify.back_to_profile")}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-neutral-400">{t("verify.code_label")}</div>
          <div className="mt-1 text-3xl font-semibold tracking-widest">
            {req.challenge_code}
          </div>

          <div className="mt-3 text-sm text-neutral-300">
            {t("verify.code_hint")}
          </div>

          <div className="mt-4">
            <label className="text-xs text-neutral-500">{t("verify.selfie_label")}</label>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-neutral-200"
              disabled={busy}
            />
          </div>

          <button
            onClick={uploadSelfie}
            disabled={busy || !selfieFile}
            className="mt-4 w-full rounded-2xl bg-white text-black py-3 text-sm font-medium disabled:opacity-60"
          >
            {t("verify.submit")}
          </button>

          <div className="mt-3 text-xs text-neutral-500">
            {t("verify.sent_hint")}
          </div>
        </div>
      )}
    </AppShell>
  );
}
