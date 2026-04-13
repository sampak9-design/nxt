"use client";

import { useEffect, useState } from "react";

type ProtectionSettings = {
  block_devtools: boolean;
  debugger_trap: boolean;
  anti_copy: boolean;
  detect_devtools: boolean;
  block_print: boolean;
};

const DEFAULTS: ProtectionSettings = {
  block_devtools: false,
  debugger_trap: false,
  anti_copy: false,
  detect_devtools: false,
  block_print: false,
};

export default function DevToolsGuard() {
  const [settings, setSettings] = useState<ProtectionSettings>(DEFAULTS);
  const [isAdmin, setIsAdmin] = useState(false);

  // Don't run on admin pages
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      setIsAdmin(true);
      return;
    }
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        const s = d.settings ?? {};
        setSettings({
          block_devtools: s.prot_block_devtools === "true",
          debugger_trap: s.prot_debugger_trap === "true",
          anti_copy: s.prot_anti_copy === "true",
          detect_devtools: s.prot_detect_devtools === "true",
          block_print: s.prot_block_print === "true",
        });
      })
      .catch(() => {});
  }, []);

  // Block DevTools shortcuts + right-click
  useEffect(() => {
    if (isAdmin || !settings.block_devtools) return;

    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
      if (e.ctrlKey && e.key.toUpperCase() === "U") { e.preventDefault(); return; }
      if (e.metaKey && e.altKey && ["I", "J", "U"].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);

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
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    };
  }, [isAdmin, settings.block_devtools]);

  // Debugger trap — infinite debugger loop that freezes DevTools
  useEffect(() => {
    if (isAdmin || !settings.debugger_trap) return;

    let active = true;
    const loop = () => {
      if (!active) return;
      // eslint-disable-next-line no-debugger
      (function () { debugger; })();
      setTimeout(loop, 100);
    };
    loop();

    return () => { active = false; };
  }, [isAdmin, settings.debugger_trap]);

  // Anti-copy — block selection, copy, drag
  useEffect(() => {
    if (isAdmin || !settings.anti_copy) return;

    const onSelect = (e: Event) => { e.preventDefault(); };
    const onCopy = (e: Event) => { e.preventDefault(); };
    const onDrag = (e: DragEvent) => { e.preventDefault(); };

    document.addEventListener("selectstart", onSelect);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("dragstart", onDrag);

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("selectstart", onSelect);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("dragstart", onDrag);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [isAdmin, settings.anti_copy]);

  // Detect DevTools open — redirect to blank page
  useEffect(() => {
    if (isAdmin || !settings.detect_devtools) return;

    let active = true;
    const check = () => {
      if (!active) return;
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      (function () { debugger; })();
      const dt = performance.now() - t0;
      // If debugger paused for >100ms, DevTools is open
      if (dt > 100) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0e1a;color:#ef4444;font-size:18px;font-family:sans-serif;text-align:center;padding:20px">Acesso não autorizado.<br>Feche as ferramentas de desenvolvedor.</div>';
      }
      if (active) setTimeout(check, 1000);
    };
    check();

    return () => { active = false; };
  }, [isAdmin, settings.detect_devtools]);

  // Block print screen
  useEffect(() => {
    if (isAdmin || !settings.block_print) return;

    const style = document.createElement("style");
    style.textContent = `@media print { body { display: none !important; } }`;
    document.head.appendChild(style);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        document.body.style.visibility = "hidden";
        setTimeout(() => { document.body.style.visibility = "visible"; }, 500);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.head.removeChild(style);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isAdmin, settings.block_print]);

  return null;
}
