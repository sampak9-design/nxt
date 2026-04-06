"use client";

import { useEffect, useState } from "react";

export type ChartColors = {
  buy:  string;
  sell: string;
  grid: string;
  win:  string;
  lose: string;
};

export const DEFAULT_COLORS: ChartColors = {
  buy:  "#2ecc71",
  sell: "#e74c3c",
  grid: "rgba(255,255,255,0.07)",
  win:  "#22c55e",
  lose: "#ef4444",
};

let cache: ChartColors | null = null;
const listeners: Set<(c: ChartColors) => void> = new Set();

export function fetchChartColors(): Promise<ChartColors> {
  return fetch("/api/admin/settings")
    .then((r) => r.json())
    .then((d) => {
      const s = d?.settings ?? {};
      const colors: ChartColors = {
        buy:  s.color_buy  || DEFAULT_COLORS.buy,
        sell: s.color_sell || DEFAULT_COLORS.sell,
        grid: s.color_grid || DEFAULT_COLORS.grid,
        win:  s.color_win  || DEFAULT_COLORS.win,
        lose: s.color_lose || DEFAULT_COLORS.lose,
      };
      cache = colors;
      listeners.forEach((fn) => fn(colors));
      return colors;
    })
    .catch(() => DEFAULT_COLORS);
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(cache ?? DEFAULT_COLORS);
  useEffect(() => {
    listeners.add(setColors);
    if (!cache) fetchChartColors();
    else setColors(cache);
    return () => { listeners.delete(setColors); };
  }, []);
  return colors;
}
