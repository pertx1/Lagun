"use client";

import { useState } from "react";
import { awardActivity } from "@/app/actions";
import { inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "./PointsToast";

/** Ayuda a construir un "mensaje yo" para hablar en casa sin atacar. No se guarda. */
export function IMessageBuilder() {
  const [feel, setFeel] = useState("");
  const [when, setWhen] = useState("");
  const [need, setNeed] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const ready = feel.trim() && when.trim();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="im-feel" className="text-sm font-bold">Me siento…</label>
      <input id="im-feel" value={feel} onChange={(e) => setFeel(e.target.value)} placeholder="triste, agobiado/a, ignorado/a…" className={inputClass} />
      <label htmlFor="im-when" className="text-sm font-bold">cuando…</label>
      <input id="im-when" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="discutimos en la cena" className={inputClass} />
      <label htmlFor="im-need" className="text-sm font-bold">y me ayudaría que…</label>
      <input id="im-need" value={need} onChange={(e) => setNeed(e.target.value)} placeholder="habláramos con más calma" className={inputClass} />
      {ready && (
        <div className="mt-2 rounded-2xl bg-bg p-4" aria-live="polite">
          <p className="text-sm text-muted">Tu mensaje:</p>
          <p className="text-lg font-bold">
            “Me siento {feel.trim()} cuando {when.trim()}
            {need.trim() ? `, y me ayudaría que ${need.trim()}` : ""}.”
          </p>
          <Button variant="secondary" className="mt-3" onClick={() => awardActivity("module").then(setPoints)}>
            Me lo guardo en la cabeza
          </Button>
        </div>
      )}
      <PointsToast points={points} text="Comunicar lo que sientes es valiente." />
      <p className="text-xs text-muted">No se guarda nada de lo que escribes aquí.</p>
    </div>
  );
}
