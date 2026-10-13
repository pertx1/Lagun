"use client";

import { useState } from "react";

const AFFIRMATIONS = [
  "Soy válido/a tal y como soy.",
  "No tengo que tener todas las respuestas sobre mí hoy.",
  "Merezco que me quieran sin cambiar quién soy.",
  "Mi forma de sentir y de querer es real.",
  "Puedo ir a mi ritmo. Conocerme es un camino, no una carrera.",
  "Hay personas como yo, y me encontraré con ellas.",
  "Lo que otros piensen de mí no define mi valor.",
];

export function Affirmations() {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="w-full rounded-2xl bg-bg p-5 text-center text-xl font-extrabold" aria-live="polite">
        {AFFIRMATIONS[i]}
      </p>
      <button
        type="button"
        onClick={() => setI((i + 1) % AFFIRMATIONS.length)}
        className="font-bold text-accent underline"
      >
        Otra frase →
      </button>
    </div>
  );
}
