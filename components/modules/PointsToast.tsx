"use client";

import { useI18n } from "@/lib/i18n/client";

/** Aviso amable de puntos ganados. Anunciado a lectores de pantalla. */
export function PointsToast({ points, text }: { points: number | null; text?: string }) {
  const { t } = useI18n();
  if (points === null) return null;
  return (
    <p role="status" className="animate-fade-up rounded-2xl bg-surface-2 px-4 py-2 text-sm font-bold">
      {text ?? t.common.pointsDefault} {points > 0 ? `+${points} 🍃` : ""}
    </p>
  );
}
