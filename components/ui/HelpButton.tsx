"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

/** Botón de "ayuda urgente": visible SIEMPRE, en todas las pantallas. Funciona sin JavaScript. */
export function HelpButton() {
  const { t } = useI18n();
  return (
    <Link
      href="/ayuda"
      className="fixed right-3 z-40 inline-flex items-center gap-1.5 rounded-full border-2 border-danger bg-bg px-3.5 py-1.5 text-sm font-extrabold text-danger shadow-soft hover:bg-danger-soft"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      aria-label={t.common.helpAria}
    >
      <span aria-hidden>🆘</span> {t.common.help}
    </Link>
  );
}
