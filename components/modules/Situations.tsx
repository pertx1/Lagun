"use client";

import { useState } from "react";

export interface Situation {
  prompt: string;
  options: { text: string; feedback: string; good: boolean }[];
}

/** Situaciones de ejemplo con varias respuestas posibles y una reflexión amable para cada una. */
export function Situations({ items }: { items: Situation[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const s = items[i];
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-2xl bg-bg p-4 font-bold">{s.prompt}</p>
      <div className="flex flex-col gap-2" role="group" aria-label="Posibles respuestas">
        {s.options.map((o, j) => (
          <button
            key={o.text}
            type="button"
            onClick={() => setPicked(j)}
            aria-pressed={picked === j}
            className={`rounded-2xl border-2 p-3 text-left text-sm font-semibold ${
              picked === j ? "border-primary bg-surface-2" : "border-line bg-bg"
            }`}
          >
            {o.text}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p role="status" className="rounded-2xl bg-surface-2 p-3 text-sm">
          {s.options[picked].good ? "💚 " : "🤔 "}
          {s.options[picked].feedback}
        </p>
      )}
      <button
        type="button"
        className="self-start text-sm font-bold text-accent underline"
        onClick={() => {
          setI((i + 1) % items.length);
          setPicked(null);
        }}
      >
        Otra situación →
      </button>
    </div>
  );
}
