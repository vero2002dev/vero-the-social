"use client";

import { useState } from "react";

export default function ChatComposer({
  onSend,
  disabled,
  showBorder = true,
}: {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  showBorder?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      await onSend(t);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`${showBorder ? "border-t border-white/10 " : ""}p-4 bg-black`}>
      <div className="flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Diz algo real…"
          className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
          maxLength={500}
          disabled={disabled || sending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          onClick={submit}
          disabled={disabled || sending}
          className="rounded-2xl bg-white text-black px-5 font-medium disabled:opacity-60"
        >
          {sending ? "…" : "Enviar"}
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Dica: perguntas simples ganham. Sem show-off.
      </p>
    </div>
  );
}
