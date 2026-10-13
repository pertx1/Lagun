"use client";

import { useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "./PointsToast";

const CHALLENGES = [
  "Saluda a alguien con quien normalmente no hablas (un “hola” ya cuenta).",
  "Pregúntale a alguien qué tal le ha ido el día, y escucha la respuesta.",
  "Manda un mensaje a una persona con la que hace tiempo que no hablas.",
  "Haz un cumplido sincero a alguien.",
  "Siéntate cerca de alguien en el recreo o en clase, aunque no habléis mucho.",
  "Comparte algo que te guste (una canción, un meme) con alguien.",
  "Dile a alguien “gracias” por algo concreto.",
  "Mira a los ojos y sonríe a la persona que te atienda en una tienda.",
];

export function GentleChallenge() {
  const [i, setI] = useState(() => new Date().getDate() % CHALLENGES.length);
  const [points, setPoints] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-2xl bg-bg p-4 text-lg font-bold">“{CHALLENGES[i]}”</p>
      <p className="text-sm text-muted">Sin presión: solo si te apetece. Intentarlo ya vale, salga como salga.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => awardActivity("challenge").then(setPoints)}>¡Lo he intentado!</Button>
        <Button variant="secondary" onClick={() => { setI((i + 1) % CHALLENGES.length); setPoints(null); }}>
          Otro reto
        </Button>
      </div>
      <PointsToast points={points} text="¡Qué valiente! Cada pasito cuenta." />
    </div>
  );
}
