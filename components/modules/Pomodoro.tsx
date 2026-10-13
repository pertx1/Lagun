"use client";

import { useEffect, useRef, useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "./PointsToast";

const MODES = {
  focus: { label: "Foco", minutes: 25 },
  short: { label: "Descanso", minutes: 5 },
} as const;
type Mode = keyof typeof MODES;

export function Pomodoro() {
  const [mode, setMode] = useState<Mode>("focus");
  const [left, setLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const endAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round(((endAt.current ?? 0) - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        setRunning(false);
        if (mode === "focus") {
          awardActivity("pomodoro").then(setPoints);
          switchMode("short");
        } else switchMode("focus");
        try {
          navigator.vibrate?.(200);
        } catch {}
      }
    }, 500);
    return () => clearInterval(id);
  }, [running, mode]);

  function switchMode(m: Mode) {
    setMode(m);
    setRunning(false);
    setLeft(MODES[m].minutes * 60);
  }

  function toggle() {
    if (running) {
      setRunning(false);
    } else {
      endAt.current = Date.now() + left * 1000;
      setRunning(true);
    }
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3">
      <div role="tablist" aria-label="Modo" className="flex gap-2">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${mode === m ? "bg-primary text-on-primary" : "bg-bg text-muted"}`}
          >
            {MODES[m].label} {MODES[m].minutes}′
          </button>
        ))}
      </div>
      <p className="font-mono text-5xl font-black tabular-nums" aria-live="off">
        {mm}:{ss}
      </p>
      <p className="sr-only" aria-live="polite">
        {running ? "" : `${MODES[mode].label}: quedan ${Math.ceil(left / 60)} minutos`}
      </p>
      <div className="flex gap-2">
        <Button onClick={toggle}>{running ? "Pausa" : "Empezar"}</Button>
        <Button variant="secondary" onClick={() => switchMode(mode)}>
          Reiniciar
        </Button>
      </div>
      <PointsToast points={points} text="¡Ronda de foco completada! Ahora toca descansar." />
    </div>
  );
}
