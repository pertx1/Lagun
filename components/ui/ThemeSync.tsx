"use client";

import { useEffect } from "react";
import type { Theme } from "@/lib/types";

export function applyTheme(theme: Theme) {
  try {
    localStorage.setItem("lagun-theme", theme);
  } catch {}
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Sincroniza el tema guardado en el perfil con el dispositivo. */
export function ThemeSync({ theme }: { theme: Theme }) {
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);
  return null;
}
