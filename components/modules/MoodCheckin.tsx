"use client";

import { useState, useTransition } from "react";
import { logMood } from "@/app/actions";
import { MOOD_EMOJI, MOOD_LABELS } from "@/config/emotions";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { PointsToast } from "./PointsToast";

const REPLIES = [
  "Siento que hoy esté siendo tan duro. Gracias por contármelo. Si te apetece, puedes hablar conmigo o respirar un ratito.",
  "Vaya, parece un día pesado. No pasa nada por estar así. Aquí estoy.",
  "Días así también cuentan. Gracias por pararte a mirarte.",
  "¡Me alegra! Guárdate eso que ha salido bien.",
  "¡Qué bien! Disfrútalo, te lo mereces.",
];

export function MoodCheckin({ question = "¿Cómo estás ahora mismo?" }: { question?: string }) {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<{ points: number; mood: number } | null>(null);
  const [pending, start] = useTransition();

  if (done)
    return (
      <div className="flex flex-col gap-2" role="status">
        <p>{REPLIES[done.mood]}</p>
        <PointsToast points={done.points} text="Check-in guardado." />
      </div>
    );

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (mood === null) return;
        start(async () => {
          const res = await logMood(mood, note);
          if (res.ok) setDone({ points: res.points, mood });
        });
      }}
    >
      <fieldset>
        <legend className="mb-2 font-bold">{question}</legend>
        <div className="grid grid-cols-5 gap-2">
          {MOOD_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={mood === i}
              onClick={() => setMood(i)}
              className={`flex flex-col items-center rounded-2xl border-2 p-2 text-xs font-bold ${
                mood === i ? "border-primary bg-surface-2" : "border-line bg-bg"
              }`}
            >
              <span aria-hidden className="text-2xl">{MOOD_EMOJI[i]}</span>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {mood !== null && (
        <>
          <label htmlFor="mood-note" className="text-sm font-bold">
            ¿Quieres añadir algo? <span className="font-normal text-muted">(opcional, solo lo ves tú)</span>
          </label>
          <textarea
            id="mood-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            className={inputClass}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </>
      )}
    </form>
  );
}
