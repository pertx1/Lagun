"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FREQUENCY_LABELS, QUESTIONS } from "@/lib/questionnaire";
import { isSafetyConcern, type Answers } from "@/lib/scoring";
import type { CountryResources } from "@/config/safety";
import type { Area, FrogState } from "@/lib/types";
import { AREA_INFO } from "@/config/areas";
import { Frog } from "@/components/Frog/Frog";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { HelpResources } from "@/components/ui/HelpResources";
import { submitAssessment, type SubmitResult } from "./actions";

type Step = "intro" | "questions" | "support" | "done";

export function Questionnaire({
  name,
  isReassessment,
  resources,
  frogState,
}: {
  name: string;
  isReassessment: boolean;
  resources: CountryResources;
  frogState: FrogState;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const q = QUESTIONS[index];
  const labels = q.labels ?? FREQUENCY_LABELS;

  // Accesibilidad: al cambiar de pregunta/pantalla, el foco va al título.
  useEffect(() => {
    headingRef.current?.focus();
  }, [index, step]);

  function submit(final: Answers) {
    startTransition(async () => {
      const res = await submitAssessment(final);
      setResult(res);
      if (res.ok) setStep("done");
    });
  }

  function answer(value: number) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (q.group === "safety" && isSafetyConcern(value)) {
      // Se muestra de inmediato la pantalla de apoyo. No bloquea: después se sigue.
      setStep("support");
      return;
    }
    if (index < QUESTIONS.length - 1) setIndex(index + 1);
    else submit(next);
  }

  function continueAfterSupport() {
    if (index < QUESTIONS.length - 1) {
      setIndex(index + 1);
      setStep("questions");
    } else submit(answers);
  }

  if (step === "intro") {
    return (
      <div className="flex flex-col items-center text-center animate-fade-up">
        <Frog size={150} mood="happy" state={frogState} label="Lagun te da la bienvenida" />
        <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-3xl font-black">
          {isReassessment ? `¿Cómo vas, ${name}?` : `¡Hola, ${name}!`}
        </h1>
        <p className="mt-3 text-lg">
          {isReassessment
            ? "Ha pasado un tiempo. ¿Revisamos juntos cómo estás? Así ajusto tu inicio a lo que te viene mejor ahora. Tus estadísticas se quedan tal cual."
            : "Antes de empezar, me gustaría conocerte un poco para preparar tu rincón."}
        </p>
        <ul className="mt-4 flex flex-col gap-1 text-muted">
          <li>✨ Son {QUESTIONS.length} preguntas cortitas.</li>
          <li>💚 No hay respuestas buenas ni malas.</li>
          <li>🔒 Solo tú puedes ver tus respuestas.</li>
        </ul>
        <Button className="mt-8 w-full" onClick={() => setStep("questions")}>
          Vamos allá
        </Button>
        {isReassessment && (
          <Button variant="ghost" className="mt-2 w-full" onClick={() => router.push("/home")}>
            Ahora no
          </Button>
        )}
      </div>
    );
  }

  if (step === "support") {
    return (
      <div className="flex flex-col gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <Frog size={80} mood="calm" state={frogState} label="" />
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-black">
            Gracias por contármelo, {name}
          </h1>
        </div>
        <p>
          Lo que sientes importa mucho, y no tienes que cargar con ello a solas. Hay personas preparadas para escucharte
          ahora mismo, gratis y sin juzgarte. Llamar o escribir puede ayudar más de lo que parece.
        </p>
        <HelpResources resources={resources} />
        <p className="text-sm text-muted">
          También puede ayudarte contárselo a alguien de confianza: un familiar, un/a profe, tu médico/a.
        </p>
        <Button onClick={continueAfterSupport} disabled={pending}>
          {pending ? "Guardando…" : "Seguir con Lagun"}
        </Button>
      </div>
    );
  }

  if (step === "done" && result?.ok) {
    const areas = (result.activeAreas ?? []) as Area[];
    return (
      <div className="flex flex-col items-center text-center animate-fade-up">
        <Frog size={150} mood="excited" hop state={frogState} label="Lagun celebra" />
        <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-3xl font-black">
          ¡Gracias, {name}!
        </h1>
        <p className="mt-3 text-lg">
          {areas.length > 0
            ? "He preparado tu inicio con cosas que pueden ayudarte con:"
            : "Parece que ahora mismo las cosas van bastante bien. ¡Me alegro! Tu inicio tendrá un poco de todo."}
        </p>
        {areas.length > 0 && (
          <ul className="mt-4 flex w-full flex-col gap-2">
            {areas.map((a) => (
              <li key={a} className="rounded-2xl bg-surface p-3 text-left">
                <span className="font-extrabold">
                  <span aria-hidden>{AREA_INFO[a].emoji}</span> {AREA_INFO[a].label}
                </span>
                <span className="block text-sm text-muted">{AREA_INFO[a].blurb}</span>
              </li>
            ))}
          </ul>
        )}
        {!!result.pointsEarned && (
          <p className="mt-4 font-bold text-accent">+{result.pointsEarned} 🍃 por dedicarte este rato</p>
        )}
        <Button className="mt-8 w-full" onClick={() => router.push("/home")}>
          Ir a mi rincón
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" key={q.id}>
      <div className="flex flex-col gap-2">
        <ProgressBar value={index} max={QUESTIONS.length} label="Progreso del cuestionario" />
        <p className="text-sm font-bold text-muted">
          {index + 1} de {QUESTIONS.length}
        </p>
      </div>

      <fieldset className="flex flex-col gap-4 animate-fade-up" disabled={pending}>
        <legend className="mb-4">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold leading-snug">
            {q.text}
          </h1>
        </legend>
        {labels.map((label, value) => {
          const selected = answers[q.id] === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => answer(value)}
              aria-pressed={selected}
              className={`min-h-13 rounded-2xl border-2 px-5 py-3 text-left text-lg font-bold transition-colors ${
                selected ? "border-primary bg-surface-2" : "border-line bg-bg hover:bg-surface"
              }`}
            >
              {label}
            </button>
          );
        })}
      </fieldset>

      {result && !result.ok && (
        <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-danger">
          {result.error}
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0 || pending}>
          ← Atrás
        </Button>
        {pending && <p role="status">Guardando…</p>}
      </div>
    </div>
  );
}
