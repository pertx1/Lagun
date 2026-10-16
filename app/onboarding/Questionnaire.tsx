"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { QUESTIONS, type QuestionItem } from "@/lib/questionnaire";
import { isSafetyConcern, scoreAssessment, type Answers } from "@/lib/scoring";
import type { CountryResources } from "@/config/safety";
import { AREAS, type Area, type FrogState } from "@/lib/types";
import { AREA_EMOJI } from "@/config/areas";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { setLocale } from "@/app/i18n-actions";
import { Frog } from "@/components/Frog/Frog";
import type { FrogMood } from "@/components/Frog/palette";
import { HelpResources } from "@/components/ui/HelpResources";
import { inputClass } from "@/components/ui/Field";
import { submitAssessment } from "./actions";

type Step =
  | { kind: "intro" }
  | { kind: "language" }
  | { kind: "name" }
  | { kind: "timezone" }
  | { kind: "checkin" }
  | { kind: "question"; q: QuestionItem; n: number }
  | { kind: "areas" };

const SEGMENTS = 5;

export function Questionnaire({
  name: initialName,
  isReassessment,
  mandatory,
  resources,
  frogState,
  initialCheckinHour,
}: {
  name: string;
  isReassessment: boolean;
  mandatory: boolean;
  resources: CountryResources;
  frogState: FrogState;
  initialCheckinHour: number;
}) {
  const router = useRouter();
  const { t, f, locale } = useI18n();
  const o = t.onboarding;

  const steps = useMemo<Step[]>(() => {
    const qs: Step[] = QUESTIONS.map((q, n) => ({ kind: "question", q, n }));
    return isReassessment
      ? [{ kind: "intro" }, ...qs, { kind: "areas" }]
      : [{ kind: "language" }, { kind: "name" }, { kind: "timezone" }, { kind: "checkin" }, ...qs, { kind: "areas" }];
  }, [isReassessment]);

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [name, setName] = useState(initialName);
  const [tz, setTz] = useState<string | null>(null);
  const [checkin, setCheckin] = useState<boolean | null>(null);
  const [hour, setHour] = useState(initialCheckinHour);
  const [chosen, setChosen] = useState<Area[] | null>(null);
  const [support, setSupport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [switching, startSwitch] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = steps[i];
  const progress = i / (steps.length - 1);
  const displayName = name.trim() || initialName;

  // Accesibilidad: al cambiar de pantalla, el foco va al título (no en la primera carga).
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [i, support]);

  const detectedTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Madrid";
  const currentTz = tz ?? detectedTz;
  const preview = useMemo(() => scoreAssessment(answers), [answers]);
  const selectedAreas = chosen ?? preview.activeAreas;

  function chooseLanguage(l: Locale) {
    if (l === locale) return;
    // Cambia el idioma al momento; el estado del onboarding se conserva.
    startSwitch(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  function next() {
    setError(null);
    if (step.kind === "question" && step.q.group === "safety" && isSafetyConcern(answers[step.q.id]) && !support) {
      // Pantalla de apoyo inmediata. No bloquea: después se sigue.
      setSupport(true);
      return;
    }
    setSupport(false);
    if (i < steps.length - 1) setI(i + 1);
    else finish();
  }

  function back() {
    setError(null);
    if (support) setSupport(false);
    else if (i > 0) setI(i - 1);
  }

  function finish() {
    start(async () => {
      const res = await submitAssessment(
        answers,
        isReassessment
          ? { chosenAreas: selectedAreas }
          : {
              displayName,
              timezone: currentTz,
              endOfDayCheckin: checkin === true,
              checkinHour: hour,
              chosenAreas: selectedAreas,
            },
      );
      if (!res.ok) {
        setError(res.error === "missing" ? o.missing : res.error === "save" ? o.saveError : o.errorGeneric);
        return;
      }
      router.push("/home");
      router.refresh();
    });
  }

  // ---------- contenido de cada pantalla ----------
  let mood: FrogMood = "happy";
  let bubble: ReactNode = "";
  let title: ReactNode = "";
  let subtitle: ReactNode = null;
  let body: ReactNode = null;
  let canContinue = true;
  let cta = t.common.continue;

  if (support) {
    mood = "calm";
    bubble = f(o.support.bubble, { name: displayName });
    title = o.support.title;
    subtitle = o.support.subtitle;
    body = <HelpResources resources={resources} compact />;
    cta = o.support.cta;
  } else if (step.kind === "intro") {
    bubble = f(o.intro.bubble, { name: displayName });
    title = o.intro.title;
    subtitle = o.intro.subtitle;
    cta = o.intro.cta;
  } else if (step.kind === "language") {
    bubble = o.language.bubble;
    title = o.language.title;
    subtitle = o.language.subtitle;
    body = (
      <Choices
        label={o.language.title}
        options={LOCALES.map((l) => LOCALE_NAMES[l])}
        langs={[...LOCALES]}
        value={LOCALES.indexOf(locale)}
        onChange={(v) => chooseLanguage(LOCALES[v])}
      />
    );
    canContinue = !switching;
  } else if (step.kind === "name") {
    bubble = o.name.bubble;
    title = o.name.title;
    subtitle = o.name.subtitle;
    body = (
      <>
        <label htmlFor="ob-name" className="sr-only">
          {o.name.placeholder}
        </label>
        <input
          id="ob-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={o.name.placeholder}
          maxLength={40}
          autoComplete="nickname"
          className={inputClass}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && next()}
        />
      </>
    );
    canContinue = name.trim().length > 0;
  } else if (step.kind === "timezone") {
    bubble = f(o.timezone.bubble, { name: displayName });
    title = o.timezone.title;
    subtitle = o.timezone.subtitle;
    const zones: string[] = (() => {
      try {
        const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone");
        return list && list.length ? list : [currentTz];
      } catch {
        return [currentTz];
      }
    })();
    if (!zones.includes(currentTz)) zones.unshift(currentTz);
    body = (
      <div className="flex flex-col gap-3">
        <label htmlFor="ob-tz" className="sr-only">
          {o.timezone.label}
        </label>
        <select id="ob-tz" value={currentTz} onChange={(e) => setTz(e.target.value)} className={inputClass}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setTz(detectedTz)} className="self-center font-bold text-accent">
          {o.timezone.useDevice}
        </button>
      </div>
    );
  } else if (step.kind === "checkin") {
    bubble = o.checkin.bubble;
    title = o.checkin.title;
    subtitle = o.checkin.subtitle;
    body = (
      <div className="flex flex-col gap-4">
        <Choices
          label={o.checkin.question}
          options={[o.checkin.yes, o.checkin.no]}
          value={checkin === null ? null : checkin ? 0 : 1}
          onChange={(v) => setCheckin(v === 0)}
        />
        {checkin && (
          <div className="animate-fade-up">
            <label htmlFor="ob-hour" className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-muted">
              {o.checkin.hour}
            </label>
            <select id="ob-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))} className={inputClass}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
    canContinue = checkin !== null;
  } else if (step.kind === "question") {
    const { q, n } = step;
    const qt = o.questions;
    mood = q.group === "safety" ? "calm" : "happy";
    bubble =
      n === 0
        ? qt.first
        : q.group === "safety"
          ? qt.safety
          : q.id === "G2"
            ? qt.almost
            : f(qt.encouragements[n % qt.encouragements.length], { name: displayName });
    title = t.questionnaire.items[q.id];
    subtitle = f(qt.counter, { n: n + 1, total: QUESTIONS.length });
    body = (
      <Choices
        label={t.questionnaire.items[q.id]}
        options={q.scale === "mood" ? t.questionnaire.moodScale : t.questionnaire.frequency}
        value={answers[q.id] ?? null}
        onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
      />
    );
    canContinue = answers[q.id] !== undefined;
  } else if (step.kind === "areas") {
    mood = "excited";
    bubble = f(preview.activeAreas.length > 0 ? o.areas.bubbleSome : o.areas.bubbleNone, { name: displayName });
    title = o.areas.title;
    subtitle = o.areas.subtitle;
    body = (
      <div role="group" aria-label={o.areas.title} className="flex flex-col gap-3">
        {AREAS.map((a) => {
          const on = selectedAreas.includes(a);
          return (
            <button
              key={a}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => setChosen(on ? selectedAreas.filter((x) => x !== a) : [...selectedAreas, a])}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${
                on ? "border-primary bg-surface-2" : "border-line bg-surface"
              }`}
            >
              <span aria-hidden className="text-2xl">
                {AREA_EMOJI[a]}
              </span>
              <span className="flex-1">
                <span className="block font-extrabold">{t.areas[a].label}</span>
                <span className="block text-sm text-muted">{t.areas[a].blurb}</span>
              </span>
              <Dot on={on} square />
            </button>
          );
        })}
      </div>
    );
    cta = o.areas.cta;
  }

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      {/* Cabecera: volver + progreso por segmentos */}
      <div className="flex h-11 items-center gap-3 pr-24">
        {i > 0 || support ? (
          <button type="button" onClick={back} className="-ml-2 rounded-full p-2 text-accent hover:bg-surface" aria-label={t.common.back}>
            <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-8" />
        )}
        <div
          role="progressbar"
          aria-label={o.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="flex flex-1 gap-1.5"
        >
          {Array.from({ length: SEGMENTS }, (_, s) => {
            const fill = Math.min(1, Math.max(0, progress * SEGMENTS - s));
            return (
              <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${fill * 100}%` }} />
              </span>
            );
          })}
        </div>
      </div>

      {/* Igel habla */}
      <div className="mt-6 flex items-start gap-3" key={`b-${i}-${support}-${locale}`}>
        <Frog state={frogState} mood={mood} size={64} label="" className="shrink-0" />
        <p className="animate-fade-up rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3 text-[0.95rem] font-semibold leading-snug" aria-live="polite">
          <span className="sr-only">{o.igelSays}</span>
          {bubble}
        </p>
      </div>

      {/* Pantalla */}
      <div className="mt-6 flex flex-1 flex-col gap-2 animate-fade-up" key={`s-${i}-${support}`}>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-black leading-tight focus:outline-none">
          {title}
        </h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
        <div className="mt-4">{body}</div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-soft p-3 text-danger">
          {error}
        </p>
      )}

      {/* Botón fijo abajo */}
      <div className="sticky bottom-0 -mx-5 mt-6 bg-bg px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={next}
          disabled={!canContinue || pending}
          className="min-h-13 w-full rounded-2xl bg-primary text-lg font-extrabold text-on-primary shadow-soft transition-opacity disabled:opacity-50"
        >
          {pending ? t.common.saving : cta}
        </button>
        {step.kind === "intro" && !mandatory && (
          <button type="button" onClick={() => router.push("/home")} className="mt-2 w-full py-2 font-bold text-muted">
            {o.intro.notNow}
          </button>
        )}
      </div>
    </div>
  );
}

function Dot({ on, square = false }: { on: boolean; square?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-6 shrink-0 place-items-center border-2 ${square ? "rounded-lg" : "rounded-full"} ${
        on ? "border-primary bg-primary text-on-primary" : "border-line"
      }`}
    >
      {on && (square ? <span className="text-xs font-black">✓</span> : <span className="size-2.5 rounded-full bg-on-primary" />)}
    </span>
  );
}

/** Opciones en tarjetas con indicador redondo (selección única). */
function Choices({
  label,
  options,
  value,
  onChange,
  langs,
}: {
  label: string;
  options: string[];
  value: number | null;
  onChange: (v: number) => void;
  /** Atributo lang de cada opción (para lectores de pantalla). */
  langs?: string[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-3">
      {options.map((opt, v) => {
        const on = value === v;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={on}
            lang={langs?.[v]}
            onClick={() => onChange(v)}
            className={`flex min-h-13 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold transition-colors ${
              on ? "border-primary bg-surface-2" : "border-line bg-surface hover:bg-surface-2"
            }`}
          >
            <span className="flex-1">{opt}</span>
            <Dot on={on} />
          </button>
        );
      })}
    </div>
  );
}
