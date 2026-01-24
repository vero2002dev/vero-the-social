"use client";

export default function Toast({
  text,
  onClose,
}: {
  text: string | null;
  onClose: () => void;
}) {
  if (!text) return null;
  return (
    <div className="fixed bottom-20 left-0 right-0 z-50">
      <div className="max-w-xl mx-auto px-5">
        <button
          onClick={onClose}
          className="w-full rounded-2xl border border-white/10 bg-black/90 backdrop-blur p-3 text-sm text-neutral-200"
        >
          {text}
        </button>
      </div>
    </div>
  );
}
