"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { logEmotion } from "@/app/actions";
import { EMOTIONS, EMOTION_BY_KEY, type EmotionKey } from "@/config/emotions";
import { EmotionJar, type JarBall } from "@/components/Jar/EmotionJar";
import { PointsToast } from "@/components/modules/PointsToast";
import { useI18n } from "@/lib/i18n/client";

const HARD: EmotionKey[] = ["tristeza", "ansiedad", "enfado", "miedo"];

export interface JarEntry {
  id: number;
  emotion: EmotionKey;
  color: string;
}

export function JarClient({ initial, isCurrentMonth, monthLabel }: { initial: JarEntry[]; isCurrentMonth: boolean; monthLabel: string }) {
  const { t, f } = useI18n();
  const j = t.jar;
  const [balls, setBalls] = useState<JarBall[]>(() =>
    initial.map((e) => ({ id: e.id, color: e.color, label: t.emotions[e.emotion] ?? e.emotion })),
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
    setBalls((b) => [...b, { id, color: def.color, label: t.emotions[emotion], fresh: true }]);
    try {
      navigator.vibrate?.(15);
    } catch {}
    const res = await logEmotion(emotion, 3);
    if (!res.ok) {
      setBalls((b) => b.filter((x) => x.id !== id));
      setError(j.error);
      return;
    }
    setResult({ points: res.points, emotion });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-surface p-4">
        <EmotionJar balls={balls} title={f(j.jarAria, { month: monthLabel, n: balls.length })} emptyText={j.empty} />
        {counts.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-2" aria-label={j.monthAria}>
            {counts.map((c) => (
              <li key={c.key} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1 text-sm font-bold">
                <span aria-hidden className="size-3 rounded-full" style={{ background: c.color }} />
                {t.emotions[c.key]} · {c.n}
              </li>
            ))}
          </ul>
        )}
      </div>

      {result && (
        <div className="flex flex-col gap-2 animate-fade-up">
          <PointsToast points={result.points} text={f(j.saved, { emoji: EMOTION_BY_KEY[result.emotion].emoji })} />
          {HARD.includes(result.emotion) && (
            <p className="rounded-2xl bg-warm p-3 text-sm">
              {j.hardA}{" "}
              <Link href="/chat" className="font-bold text-accent underline">
                {j.hardChat}
              </Link>{" "}
              {j.hardOr}{" "}
              <Link href="/home#respirar" className="font-bold text-accent underline">
                {j.hardBreathe}
              </Link>
              {j.hardB}{" "}
              <Link href="/ayuda" className="font-bold text-accent underline">
                {j.hardHelp}
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {isCurrentMonth && (
        <section aria-labelledby="add-h" className="flex flex-col gap-3">
          <h2 id="add-h" className="text-xl font-extrabold">
            {j.add}
          </h2>
          <p className="-mt-2 text-sm text-muted">{j.tapHint}</p>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label={j.groupAria}>
            {EMOTIONS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => drop(e.key)}
                aria-label={f(j.saveAria, { emotion: t.emotions[e.key] })}
                className="flex flex-col items-center gap-1 rounded-2xl border-2 border-line bg-bg p-2 text-xs font-bold transition-transform hover:bg-surface-2 active:scale-90"
              >
                <span aria-hidden className="grid size-9 place-items-center rounded-full text-xl" style={{ background: e.color }}>
                  {e.emoji}
                </span>
                {t.emotions[e.key]}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="text-danger">{error}</p>}
          <p className="text-sm text-muted">{j.allValid}</p>
        </section>
      )}
    </div>
  );
}
