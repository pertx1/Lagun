"use client";

/** Aviso amable de puntos ganados. Anunciado a lectores de pantalla. */
export function PointsToast({ points, text }: { points: number | null; text?: string }) {
  if (points === null) return null;
  return (
    <p role="status" className="animate-fade-up rounded-2xl bg-surface-2 px-4 py-2 text-sm font-bold">
      {text ?? "¡Bien hecho cuidándote!"} {points > 0 ? `+${points} 🍃` : ""}
    </p>
  );
}
