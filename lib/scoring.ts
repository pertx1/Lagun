import { QUESTIONS } from "./questionnaire";
import { AREAS, type Area } from "./types";

export type Answers = Record<string, number>;

export interface AssessmentScores {
  /** pct por área, 0..1 (suma / (nº ítems × 4)). Comparables entre áreas. */
  areas: Record<Area, number>;
  /** Línea base de bienestar (no puntúa para área). */
  wellbeing: {
    /** G1: 0 = muy mal … 4 = muy bien */
    mood: number | null;
    /** G2: 0 = nunca tengo a alguien … 4 = casi siempre */
    support: number | null;
    /** G2 invertido (0..4): mayor = más falta de apoyo. */
    support_need: number | null;
  };
}

export interface AssessmentResult {
  scores: AssessmentScores;
  primaryArea: Area | null;
  activeAreas: Area[];
  /** C1 ≥ 3 → mostrar de inmediato la pantalla de apoyo. */
  safetyFlag: boolean;
}

/**
 * "Áreas activas = las que estén dentro del 15% del máximo".
 * Se interpreta como 15 puntos porcentuales por debajo del máximo
 * (pct ≥ max − 0.15). Cambia aquí si se prefiere un margen relativo.
 */
export const ACTIVE_MARGIN = 0.15;

/** Umbral de C1 a partir del cual se ofrece ayuda (3 = "A menudo"). */
export const SAFETY_THRESHOLD = 3;

export function clampAnswer(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < 0 || n > 4) return null;
  return n;
}

export function isSafetyConcern(c1: number | null | undefined): boolean {
  return typeof c1 === "number" && c1 >= SAFETY_THRESHOLD;
}

export function scoreAssessment(answers: Answers): AssessmentResult {
  const sums: Record<Area, number> = { acad: 0, soc: 0, fam: 0, iden: 0 };
  const counts: Record<Area, number> = { acad: 0, soc: 0, fam: 0, iden: 0 };

  for (const q of QUESTIONS) {
    if (q.group === "general" || q.group === "safety") continue;
    counts[q.group] += 1;
    const v = clampAnswer(answers[q.id]);
    if (v !== null) sums[q.group] += v;
  }

  const areas = {} as Record<Area, number>;
  for (const a of AREAS) {
    areas[a] = counts[a] ? round3(sums[a] / (counts[a] * 4)) : 0;
  }

  // Área principal = mayor pct. Empates: se respeta el orden de AREAS.
  let primaryArea: Area | null = null;
  let max = 0;
  for (const a of AREAS) {
    if (areas[a] > max) {
      max = areas[a];
      primaryArea = a;
    }
  }

  const activeAreas =
    primaryArea === null ? [] : AREAS.filter((a) => areas[a] > 0 && areas[a] >= max - ACTIVE_MARGIN - 1e-9);

  const mood = clampAnswer(answers.G1);
  const support = clampAnswer(answers.G2);

  return {
    scores: {
      areas,
      wellbeing: { mood, support, support_need: support === null ? null : 4 - support },
    },
    primaryArea,
    activeAreas,
    safetyFlag: isSafetyConcern(clampAnswer(answers.C1)),
  };
}

/** Días desde la última evaluación a partir de los cuales se invita a repetirla. */
export const REASSESS_AFTER_DAYS = 30;

export function isReassessmentDue(lastTakenAt: string | Date | null | undefined, now = new Date()): boolean {
  if (!lastTakenAt) return true;
  const last = typeof lastTakenAt === "string" ? new Date(lastTakenAt) : lastTakenAt;
  return now.getTime() - last.getTime() >= REASSESS_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
