"use client";

import { useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { PointsToast } from "./PointsToast";

/**
 * Espacio para desahogarse. Lo que se escribe NO se guarda ni se envía a
 * ningún sitio: al pulsar "Soltar", desaparece.
 */
export function VentSpace() {
  const [text, setText] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [points, setPoints] = useState<number | null>(null);

  function release() {
    if (!text.trim()) return;
    setReleasing(true);
    setTimeout(() => {
      setText("");
      setReleasing(false);
      awardActivity("journal").then(setPoints);
    }, 1200);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="vent" className="text-sm text-muted">
        Escribe lo que necesites soltar. No se guarda en ningún sitio: cuando pulses “Soltar”, se va.
      </label>
      <textarea
        id="vent"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${inputClass} ${releasing ? "animate-float-away" : ""}`}
        autoComplete="off"
        spellCheck={false}
      />
      <Button variant="secondary" onClick={release} disabled={!text.trim() || releasing}>
        🎈 Soltar
      </Button>
      <PointsToast points={points} text="Soltado. A veces sacarlo ya alivia un poquito." />
    </div>
  );
}
