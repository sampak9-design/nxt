"use client";

import { useEffect, useState } from "react";

export default function DevToolsGuard() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        if (d.settings?.devtools_protection === "true") setEnabled(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Block right-click
    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); };

    // Block keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toUpperCase() === "U") { e.preventDefault(); return; }
      // Cmd+Option+I (Mac DevTools)
      if (e.metaKey && e.altKey && e.key.toUpperCase() === "I") { e.preventDefault(); return; }
      // Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key.toUpperCase() === "J") { e.preventDefault(); return; }
      // Cmd+Option+U (Mac View Source)
      if (e.metaKey && e.altKey && e.key.toUpperCase() === "U") { e.preventDefault(); return; }
    };

    // Block text selection on body
    const onSelectStart = (e: Event) => { e.preventDefault(); };

    // Block drag
    const onDragStart = (e: DragEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "IMG" || tag === "A") e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("dragstart", onDragStart);

    // Disable console methods
    const noop = () => {};
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    console.log = noop;
    console.warn = noop;
    console.error = noop;

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("dragstart", onDragStart);
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    };
  }, [enabled]);

  return null;
}
