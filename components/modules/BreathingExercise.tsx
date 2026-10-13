"use client";

import { useEffect, useRef, useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "./PointsToast";

const PHASES = [
  { label: "Inspira", seconds: 4 },
  { label: "Aguanta", seconds: 4 },
  { label: "Suelta", seconds: 6 },
] as const;
const ROUNDS = 4;

/** Respiración guiada 4-4-6, unos 56 segundos. */
export function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState<number>(PHASES[0].seconds);
  const [points, setPoints] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  function start() {
    setRunning(true);
    setPoints(null);
    setPhase(0);
    setRound(0);
    setLeft(PHASES[0].seconds);
    let ph = 0;
    let rd = 0;
    let l: number = PHASES[0].seconds;
    timer.current = setInterval(() => {
      l -= 1;
      if (l <= 0) {
        ph += 1;
        if (ph >= PHASES.length) {
          ph = 0;
          rd += 1;
          if (rd >= ROUNDS) {
            if (timer.current) clearInterval(timer.current);
            setRunning(false);
            awardActivity("breathing").then(setPoints);
            return;
          }
          setRound(rd);
        }
        setPhase(ph);
        l = PHASES[ph].seconds;
      }
      setLeft(l);
    }, 1000);
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
  }

  const current = PHASES[phase];
  const scale = !running ? 0.7 : current.label === "Inspira" ? 1 : current.label === "Aguanta" ? 1 : 0.65;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative grid size-44 place-items-center">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-brand/30"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${running ? current.seconds : 0.4}s ease-in-out`,
          }}
        />
        <div aria-hidden className="absolute inset-8 rounded-full bg-brand/40" />
        <p className="relative text-center font-extrabold" aria-live="polite">
          {running ? (
            <>
              <span className="block text-xl">{current.label}</span>
              <span className="text-3xl">{left}</span>
            </>
          ) : (
            "¿Respiramos?"
          )}
        </p>
      </div>
      {running && <p className="text-sm text-muted">Ronda {round + 1} de {ROUNDS}</p>}
      {running ? (
        <Button variant="secondary" onClick={stop}>
          Parar
        </Button>
      ) : (
        <Button onClick={start}>Empezar (1 min)</Button>
      )}
      <PointsToast points={points} text="Un minuto para ti. ¡Bien hecho!" />
    </div>
  );
}
