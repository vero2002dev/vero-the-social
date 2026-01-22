"use client";

import { useRef } from "react";

export default function ImagePickerButton({
  onPick,
  disabled,
}: {
  onPick: (file: File) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={disabled}
        className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20 disabled:opacity-60"
      >
        📷
      </button>
    </>
  );
}
