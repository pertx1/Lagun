"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { logEmotion } from "@/app/actions";
import { EMOTIONS, EMOTION_BY_KEY, type EmotionKey } from "@/config/emotions";
import { EmotionJar, type JarBall } from "@/components/Jar/EmotionJar";
import { PointsToast } from "@/components/modules/PointsToast";

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
  const [result, setResult] = useState<{ points: number; emotion: EmotionKey } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tmp = useRef(0);

  const counts = EMOTIONS.map((e) => ({ ...e, n: balls.filter((b) => b.color === e.color).length })).filter((e) => e.n > 0);

  /** Un toque = una bola. Aparece al instante y se guarda en segundo plano. */
  async function drop(emotion: EmotionKey) {
    setError(null);
    const def = EMOTION_BY_KEY[emotion];
    const id = `tmp-${++tmp.current}`;
    setBalls((b) => [...b, { id, color: def.color, label: def.label, fresh: true }]);
    try {
      navigator.vibrate?.(15);
    } catch {}
    const res = await logEmotion(emotion, 3);
    if (!res.ok) {
      setBalls((b) => b.filter((x) => x.id !== id));
      setError("No se ha podido guardar. Inténtalo otra vez.");
      return;
    }
    setResult({ points: res.points, emotion });
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
          {HARD.includes(result.emotion) && (
            <p className="rounded-2xl bg-warm p-3 text-sm">
              Si te pesa, ¿te apetece{" "}
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
          <p className="-mt-2 text-sm text-muted">Toca una emoción y caerá en tu jarra.</p>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Toca una emoción para guardarla en la jarra">
            {EMOTIONS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => drop(e.key)}
                aria-label={`Guardar ${e.label} en la jarra`}
                className="flex flex-col items-center gap-1 rounded-2xl border-2 border-line bg-bg p-2 text-xs font-bold transition-transform hover:bg-surface-2 active:scale-90"
              >
                <span aria-hidden className="grid size-9 place-items-center rounded-full text-xl" style={{ background: e.color }}>
                  {e.emoji}
                </span>
                {e.label}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="text-danger">{error}</p>}
          <p className="text-sm text-muted">Todas las emociones valen. No hay emociones buenas ni malas: todas te cuentan algo.</p>
        </section>
      )}
    </div>
  );
}
