import { EMOTION_BY_KEY, type EmotionKey } from "@/config/emotions";
import { es, type Dict } from "@/lib/i18n/dict/es";
import { fmt } from "@/lib/i18n/config";
import { daysUntil, partsInTz } from "./dates";

/**
 * Patrones entre el calendario (exámenes/entregas) y cómo se siente la persona.
 * Todo se calcula con sus propios datos y no se guarda en ningún sitio.
 */

/** Días antes de un examen que cuentan como "época de examen" (incluye el día del examen). */
export const EXAM_WINDOW_DAYS = 3;
/** A partir de cuántas tareas en 7 días se considera una semana cargada. */
export const BUSY_THRESHOLD = 3;
/** Mínimo de registros en cada grupo para sacar conclusiones. */
const MIN_SAMPLES = 2;

export interface CalendarItem {
  title: string;
  due_date: string; // YYYY-MM-DD
}
export interface MoodRow {
  mood: number;
  created_at: string;
}
export interface EmotionRow {
  emotion: string;
  created_at: string;
}

export type Load = "libre" | "normal" | "cargada";

export interface StudyPatterns {
  /** Tareas en los próximos 7 y 14 días. */
  upcoming7: number;
  upcoming14: number;
  load: Load;
  next: { title: string; inDays: number } | null;
  /** Ánimo medio (0-4) en época de exámenes y fuera de ella. null si no hay datos suficientes. */
  examMood: number | null;
  otherMood: number | null;
  /** Emociones que aparecen bastante más en época de exámenes. */
  examEmotions: { key: EmotionKey; label: string; examShare: number; otherShare: number }[];
  /** Frases amables listas para mostrar o para dar a la IA. */
  insights: string[];
}

function isExamPeriod(day: string, examDays: string[]) {
  return examDays.some((d) => {
    const diff = daysUntil(d, day);
    return diff >= 0 && diff <= EXAM_WINDOW_DAYS;
  });
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const moodWord = (m: number, words: string[] = es.patterns.moodWords) => words[Math.max(0, Math.min(4, Math.round(m)))];

export function analyzeStudyPatterns(input: {
  items: CalendarItem[];
  moods: MoodRow[];
  emotions: EmotionRow[];
  timeZone: string;
  now?: Date;
  /** Diccionario del idioma de la persona (para las frases). Por defecto, castellano. */
  t?: Dict;
}): StudyPatterns {
  const { items, moods, emotions, timeZone } = input;
  const t = input.t ?? es;
  const tp = t.patterns;
  const today = partsInTz(input.now ?? new Date(), timeZone).ymd;
  const examDays = items.map((i) => i.due_date);
  const dayOf = (iso: string) => partsInTz(new Date(iso), timeZone).ymd;

  // Carga actual
  const future = items
    .map((i) => ({ title: i.title, inDays: daysUntil(i.due_date, today) }))
    .filter((i) => i.inDays >= 0)
    .sort((a, b) => a.inDays - b.inDays);
  const upcoming7 = future.filter((i) => i.inDays <= 7).length;
  const upcoming14 = future.filter((i) => i.inDays <= 14).length;
  const load: Load = upcoming7 >= BUSY_THRESHOLD ? "cargada" : upcoming7 > 0 ? "normal" : "libre";

  // Ánimo en época de exámenes vs. el resto
  const examMoods: number[] = [];
  const otherMoods: number[] = [];
  for (const m of moods) (isExamPeriod(dayOf(m.created_at), examDays) ? examMoods : otherMoods).push(m.mood);
  const examMood = examMoods.length >= MIN_SAMPLES && otherMoods.length >= MIN_SAMPLES ? avg(examMoods) : null;
  const otherMood = examMood === null ? null : avg(otherMoods);

  // Emociones que suben en época de exámenes
  const examCount = new Map<string, number>();
  const otherCount = new Map<string, number>();
  let examTotal = 0;
  let otherTotal = 0;
  for (const e of emotions) {
    if (isExamPeriod(dayOf(e.created_at), examDays)) {
      examCount.set(e.emotion, (examCount.get(e.emotion) ?? 0) + 1);
      examTotal++;
    } else {
      otherCount.set(e.emotion, (otherCount.get(e.emotion) ?? 0) + 1);
      otherTotal++;
    }
  }
  const examEmotions: StudyPatterns["examEmotions"] = [];
  if (examTotal >= MIN_SAMPLES && otherTotal >= MIN_SAMPLES) {
    for (const [key, n] of examCount) {
      const def = EMOTION_BY_KEY[key as EmotionKey];
      if (!def) continue;
      const examShare = n / examTotal;
      const otherShare = (otherCount.get(key) ?? 0) / otherTotal;
      if (n >= MIN_SAMPLES && examShare >= otherShare + 0.15) {
        examEmotions.push({ key: def.key, label: t.emotions[def.key].toLowerCase(), examShare, otherShare });
      }
    }
    examEmotions.sort((a, b) => b.examShare - b.otherShare - (a.examShare - a.otherShare));
  }

  // Frases
  const insights: string[] = [];
  if (examMood !== null && otherMood !== null) {
    if (otherMood - examMood >= 0.5)
      insights.push(fmt(tp.moodDrop, { from: moodWord(otherMood, tp.moodWords), to: moodWord(examMood, tp.moodWords) }));
    else if (examMood - otherMood >= 0.5) insights.push(tp.moodBetter);
    else insights.push(tp.moodSame);
  }
  if (examEmotions.length) {
    const names = examEmotions.slice(0, 2).map((e) => e.label);
    insights.push(fmt(tp.emotions, { names: names.join(` ${tp.and} `) }));
  }
  if (load === "cargada")
    insights.push(fmt(tp.busy, { n: upcoming7 }));

  return { upcoming7, upcoming14, load, next: future[0] ?? null, examMood, otherMood, examEmotions, insights };
}

/** Texto para la IA (con tacto: patrones, no diagnósticos). */
export function describePatternsForAI(p: StudyPatterns): string {
  const out: string[] = [];
  out.push(
    `Carga de estudios: ${p.upcoming7} exámenes/entregas en los próximos 7 días y ${p.upcoming14} en 14 (semana ${p.load}).` +
      (p.next ? ` El más cercano: ${p.next.title} (${p.next.inDays === 0 ? "hoy" : p.next.inDays === 1 ? "mañana" : `en ${p.next.inDays} días`}).` : ""),
  );
  if (p.examMood !== null && p.otherMood !== null)
    out.push(
      `Patrón observado en sus registros: en los ${EXAM_WINDOW_DAYS} días antes de un examen su ánimo medio es ${moodWord(p.examMood)} frente a ${moodWord(p.otherMood)} el resto de días.`,
    );
  if (p.examEmotions.length)
    out.push(`En época de exámenes registra más: ${p.examEmotions.map((e) => es.emotions[e.key].toLowerCase()).join(", ")}.`);
  return `CALENDARIO Y PATRONES (de sus propios datos):\n${out.join(" ")}
Cómo usarlo: si la semana está cargada o hay un examen cerca, tenlo presente con suavidad (por ejemplo "veo que tienes bastante esta semana"), ayuda a priorizar y a trocear, y si hay un patrón de bajón antes de exámenes, puedes mencionarlo con cariño para anticiparse ("he notado que los días antes de un examen te cuesta más; ¿preparamos algo para esos días?"). Nunca lo uses para presionar ni lo presentes como un diagnóstico.`;
}
