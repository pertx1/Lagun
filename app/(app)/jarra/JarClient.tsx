"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { logEmotion } from "@/app/actions";
import { EMOTIONS, EMOTION_BY_KEY, type EmotionKey } from "@/config/emotions";
import { EmotionJar, type JarBall } from "@/components/Jar/EmotionJar";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "@/components/modules/PointsToast";

const INTENSITY = ["Un poquito", "Algo", "Bastante", "Mucho", "Muchísimo"];
const HARD: EmotionKey[] = ["tristeza", "ansiedad", "enfado", "miedo"];

export interface JarEntry {
  id: number;
  emotion: EmotionKey;
  color: string;
}

export function JarClient({ initial, isCurrentMonth, monthLabel }: { initial: JarEntry[]; isCurrentMonth: boolean; monthLabel: string }) {
  const [balls, setBalls] = useState<JarBall[]>(() =>
    initial.map((e) => ({ id: e.id, color: e.color, label: EMOTION_BY_KEY[e.emotion]?.label ?? e.emotion })),
  );
  const [picked, setPicked] = useState<EmotionKey | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ points: number; emotion: EmotionKey; intensity: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = EMOTIONS.map((e) => ({ ...e, n: balls.filter((b) => b.color === e.color).length })).filter((e) => e.n > 0);

  function save() {
    if (!picked) return;
    setError(null);
    start(async () => {
      const res = await logEmotion(picked, intensity);
      if (!res.ok) {
        setError("No se ha podido guardar. Inténtalo otra vez.");
        return;
      }
      setBalls((b) => [...b, { id: res.emotion.id, color: res.emotion.color, label: EMOTION_BY_KEY[picked].label, fresh: true }]);
      setResult({ points: res.points, emotion: picked, intensity });
      setPicked(null);
      setIntensity(3);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-surface p-4">
        <EmotionJar balls={balls} title={`Tu jarra de ${monthLabel}: ${balls.length} emociones guardadas`} />
        {counts.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Emociones de este mes">
            {counts.map((c) => (
              <li key={c.key} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1 text-sm font-bold">
                <span aria-hidden className="size-3 rounded-full" style={{ background: c.color }} />
                {c.label} · {c.n}
              </li>
            ))}
          </ul>
        )}
      </div>

      {result && (
        <div className="flex flex-col gap-2 animate-fade-up">
          <PointsToast points={result.points} text={`${EMOTION_BY_KEY[result.emotion].emoji} Guardada en tu jarra.`} />
          {HARD.includes(result.emotion) && result.intensity >= 4 && (
            <p className="rounded-2xl bg-warm p-3 text-sm">
              Parece que pesa bastante ahora mismo. ¿Te apetece{" "}
              <Link href="/chat" className="font-bold text-accent underline">hablarlo con Igel</Link> o{" "}
              <Link href="/home#respirar" className="font-bold text-accent underline">respirar un minuto</Link>? Y si lo
              necesitas, aquí tienes <Link href="/ayuda" className="font-bold text-accent underline">ayuda</Link>.
            </p>
          )}
        </div>
      )}

      {isCurrentMonth && (
        <section aria-labelledby="add-h" className="flex flex-col gap-3">
          <h2 id="add-h" className="text-xl font-extrabold">
            ¿Qué sientes ahora?
          </h2>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Elige una emoción">
            {EMOTIONS.map((e) => (
              <button
                key={e.key}
                type="button"
                aria-pressed={picked === e.key}
                onClick={() => setPicked(e.key)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-bold ${
                  picked === e.key ? "border-primary bg-surface-2" : "border-line bg-bg"
                }`}
              >
                <span aria-hidden className="grid size-9 place-items-center rounded-full text-xl" style={{ background: e.color }}>
                  {e.emoji}
                </span>
                {e.label}
              </button>
            ))}
          </div>
          {picked && (
            <div className="flex flex-col gap-2 animate-fade-up">
              <label htmlFor="intensity" className="font-bold">
                ¿Cuánto? <span className="font-normal">{INTENSITY[intensity - 1]}</span>
              </label>
              <input
                id="intensity"
                type="range"
                min={1}
                max={5}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                aria-valuetext={INTENSITY[intensity - 1]}
                className="accent-[var(--primary)]"
              />
              <Button onClick={save} disabled={pending}>
                {pending ? "Guardando…" : "Dejar caer en la jarra"}
              </Button>
            </div>
          )}
          {error && <p role="alert" className="text-danger">{error}</p>}
          <p className="text-sm text-muted">Todas las emociones valen. No hay emociones buenas ni malas: todas te cuentan algo.</p>
        </section>
      )}
    </div>
  );
}
