"use client";

import { useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "./PointsToast";

const STEPS = [
  { n: 5, text: "cosas que puedes VER", emoji: "👀" },
  { n: 4, text: "cosas que puedes TOCAR", emoji: "✋" },
  { n: 3, text: "sonidos que puedes OÍR", emoji: "👂" },
  { n: 2, text: "olores que puedes NOTAR", emoji: "👃" },
  { n: 1, text: "sabor que notas ahora", emoji: "👅" },
];

/** Grounding 5-4-3-2-1: para volver al presente cuando la cabeza va a mil. */
export function Grounding() {
  const [step, setStep] = useState(-1);
  const [points, setPoints] = useState<number | null>(null);

  if (step === -1)
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm">Cuando todo va muy rápido, esto te ayuda a aterrizar en el aquí y ahora.</p>
        <Button variant="secondary" onClick={() => { setStep(0); setPoints(null); }}>
          Empezar 5-4-3-2-1
        </Button>
        <PointsToast points={points} text="Has vuelto al presente." />
      </div>
    );

  const s = STEPS[step];
  return (
    <div className="flex flex-col items-center gap-3 text-center" aria-live="polite">
      <p className="text-5xl" aria-hidden>{s.emoji}</p>
      <p className="text-xl font-extrabold">
        Nombra {s.n} {s.text}
      </p>
      <p className="text-sm text-muted">Tómate tu tiempo. Puedes decirlo en voz baja o solo pensarlo.</p>
      <Button
        onClick={() => {
          if (step < STEPS.length - 1) setStep(step + 1);
          else {
            setStep(-1);
            awardActivity("grounding").then(setPoints);
          }
        }}
      >
        {step < STEPS.length - 1 ? "Hecho, siguiente" : "Terminar"}
      </Button>
    </div>
  );
}
