"use client";

import { useState } from "react";
import type { IntentKey } from "@/lib/rpc";
import { rpcSetIntent } from "@/lib/rpc";
import { useRouter } from "next/navigation";
import { logEvent } from "@/lib/events";
import { useI18n } from "@/components/I18nProvider";

export default function IntentPicker() {
  const [intent, setIntent] = useState<IntentKey>("curiosity");
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const { t } = useI18n();

  const intents: { key: IntentKey; title: string; desc: string }[] = [
    { key: "curiosity", title: t("intent.curiosity"), desc: t("intent.desc.curiosity") },
    { key: "connection", title: t("intent.connection"), desc: t("intent.desc.connection") },
    { key: "desire", title: t("intent.desire"), desc: t("intent.desc.desire") },
    { key: "private", title: t("intent.private"), desc: t("intent.desc.private") },
    { key: "casual", title: t("intent.casual"), desc: t("intent.desc.casual") },
    { key: "no_labels", title: t("intent.no_labels"), desc: t("intent.desc.no_labels") },
  ];

  async function onSave() {
    setErr(null);
    setLoading(true);
    try {
      await rpcSetIntent({ intent_key: intent, intensity, note });
      await logEvent("intent_set", { intent_key: intent, intensity });
      router.push("/discover");
    } catch (e: any) {
      setErr(e?.message ?? t("intent.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("intent.title")}</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {t("intent.subtitle")}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {intents.map((it) => (
          <button
            key={it.key}
            onClick={() => setIntent(it.key)}
            className={[
              "text-left p-4 rounded-2xl border transition",
              intent === it.key
                ? "border-white/60 bg-white/5"
                : "border-white/10 hover:border-white/20",
            ].join(" ")}
          >
            <div className="font-medium">{it.title}</div>
            <div className="text-sm text-neutral-400">{it.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-300">{t("intent.intensity")}</span>
          <span className="text-sm text-neutral-400">{intensity}/5</span>
        </div>
        <input
          className="mt-3 w-full"
          type="range"
          min={1}
          max={5}
          value={intensity}
          onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
        />
        <div className="mt-4">
          <label className="text-sm text-neutral-300">{t("intent.note")}</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("intent.note_placeholder")}
            className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
            maxLength={80}
          />
        </div>
      </div>

      {err && (
        <div className="mt-4 text-sm text-red-400">
          {err}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-medium disabled:opacity-60"
      >
        {loading ? t("intent.loading") : t("intent.cta")}
      </button>

      <p className="mt-3 text-xs text-neutral-500">
        {t("intent.expire_note")}
      </p>
    </div>
  );
}
