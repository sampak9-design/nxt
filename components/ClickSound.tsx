"use client";

import { useEffect } from "react";

export default function ClickSound() {
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.tagName === "BUTTON" ||
        el.closest("button") ||
        el.getAttribute("role") === "button" ||
        el.closest("[role='button']") ||
        el.tagName === "A" ||
        el.closest("a")
      ) {
        if (!audio) {
          audio = new Audio("/sounds/666herohero-click-button-131479.mp3");
          audio.volume = 0.3;
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return null;
}
