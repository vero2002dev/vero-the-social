"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";

type ReportTarget = "profile" | "post" | "message";

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  defaultReason,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTarget;
  targetId: string | number | null;
  defaultReason?: string;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState(defaultReason ?? "harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMsg(null);
      setDetails("");
      setReason(defaultReason ?? "harassment");
    }
  }, [open, defaultReason]);

  if (!open) return null;

  const title =
    targetType === "post"
      ? t("report.title_post")
      : targetType === "message"
      ? t("report.title_message")
      : t("report.title_profile");

  async function submit() {
    if (!targetId) return;
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.rpc("rpc_create_report", {
        p_target_type: targetType,
        p_target_id: String(targetId),
        p_reason: reason,
        p_details: details || null,
      });
      if (error) throw error;
      setMsg(t("report.success"));
      setTimeout(onClose, 700);
    } catch (e: any) {
      setMsg(t("report.error", { msg: e?.message ?? t("common.error_generic") }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-5">
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-4 grid gap-2">
          <label className="text-xs text-neutral-400">{t("report.reason_label")}</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            disabled={busy}
          >
            <option value="spam">{t("report.reason_spam")}</option>
            <option value="scam">{t("report.reason_scam")}</option>
            <option value="harassment">{t("report.reason_harassment")}</option>
            <option value="impersonation">{t("report.reason_impersonation")}</option>
            <option value="nudity">{t("report.reason_nudity")}</option>
            <option value="other">{t("report.reason_other")}</option>
          </select>
        </div>

        <div className="mt-4 grid gap-2">
          <label className="text-xs text-neutral-400">{t("report.details_label")}</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="min-h-[88px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder={t("report.details_placeholder")}
            disabled={busy}
          />
        </div>

        {msg ? <div className="mt-3 text-xs text-neutral-400">{msg}</div> : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 py-2 text-sm text-neutral-200 hover:border-white/20"
            disabled={busy}
          >
            {t("report.cancel")}
          </button>
          <button
            onClick={submit}
            className="rounded-2xl bg-white text-black py-2 text-sm font-medium disabled:opacity-60"
            disabled={busy || !targetId}
          >
            {busy ? t("common.saving") : t("report.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
