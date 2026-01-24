"use client";

import { useRef } from "react";

export function useSwipe({
  onLeft,
  onRight,
  threshold = 60,
}: {
  onLeft: () => void;
  onRight: () => void;
  threshold?: number;
}) {
  const startX = useRef<number | null>(null);
  const deltaX = useRef<number>(0);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0]?.clientX ?? null;
    deltaX.current = 0;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const x = e.touches[0]?.clientX ?? 0;
    deltaX.current = x - startX.current;
  }

  function onTouchEnd() {
    if (startX.current === null) return;
    const dx = deltaX.current;

    startX.current = null;
    deltaX.current = 0;

    if (dx > threshold) onRight();
    else if (dx < -threshold) onLeft();
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}
