"use client";

import { useEffect, useRef, useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "./PointsToast";
import { useI18n } from "@/lib/i18n/client";

const PHASES = [
  { key: "inhale", seconds: 4 },
  { key: "hold", seconds: 4 },
  { key: "exhale", seconds: 6 },
] as const;
const ROUNDS = 4;

/** Respiración guiada 4-4-6, unos 56 segundos. */
export function BreathingExercise() {
  const { t, f } = useI18n();
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
  const scale = !running ? 0.7 : current.key === "exhale" ? 0.65 : 1;

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
              <span className="block text-xl">{t.breathing[current.key]}</span>
              <span className="text-3xl">{left}</span>
            </>
          ) : (
            t.breathing.idle
          )}
        </p>
      </div>
      {running && <p className="text-sm text-muted">{f(t.breathing.round, { n: round + 1, total: ROUNDS })}</p>}
      {running ? (
        <Button variant="secondary" onClick={stop}>
          {t.breathing.stop}
        </Button>
      ) : (
        <Button onClick={start}>{t.breathing.start}</Button>
      )}
      <PointsToast points={points} text={t.breathing.done} />
    </div>
  );
}
