"use client";

import { useState } from "react";
import type { IntentKey } from "@/lib/rpc";
import { rpcSetIntent } from "@/lib/rpc";
import { useRouter } from "next/navigation";
import { logEvent } from "@/lib/events";

const INTENTS: { key: IntentKey; title: string; desc: string }[] = [
  { key: "curiosity", title: "Curiosidade", desc: "Explorar sem pressao." },
  { key: "connection", title: "Conexao", desc: "Conversas com intencao." },
  { key: "desire", title: "Desejo", desc: "Quimica direta, com respeito." },
  { key: "private", title: "Privado", desc: "O que e teu, fica teu." },
  { key: "casual", title: "Casual", desc: "Leve, sem promessas." },
  { key: "no_labels", title: "Sem rotulos", desc: "Deixa acontecer." },
];

export default function IntentPicker() {
  const [intent, setIntent] = useState<IntentKey>("curiosity");
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function onSave() {
    setErr(null);
    setLoading(true);
    try {
      await rpcSetIntent({ intent_key: intent, intensity, note });
      await logEvent("intent_set", { intent_key: intent, intensity });
      router.push("/discover");
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao guardar intencao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Agora.</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Define a tua intencao. Isto muda o que ves.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {INTENTS.map((it) => (
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
          <span className="text-sm text-neutral-300">Intensidade</span>
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
          <label className="text-sm text-neutral-300">Nota (opcional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: sem dramas, so vibes..."
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
        {loading ? "A guardar..." : "Continuar"}
      </button>

      <p className="mt-3 text-xs text-neutral-500">
        A tua intencao expira em 24h. Podes mudar quando quiseres.
      </p>
    </div>
  );
}
