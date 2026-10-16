"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { QUESTION_IDS } from "@/lib/questionnaire";
import { clampAnswer, scoreAssessment, type Answers } from "@/lib/scoring";
import { AREAS, type Area } from "@/lib/types";

export interface OnboardingExtras {
  /** Solo en el primer onboarding. */
  displayName?: string;
  timezone?: string;
  endOfDayCheckin?: boolean;
  checkinHour?: number;
  /** Temas que la persona confirma en la última pantalla (preseleccionados según sus respuestas). */
  chosenAreas?: Area[];
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
  primaryArea?: Area | null;
  activeAreas?: Area[];
  pointsEarned?: number;
}

function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("es", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function submitAssessment(raw: Answers, extras: OnboardingExtras = {}): Promise<SubmitResult> {
  const { supabase, userId } = await requireProfile({ allowNotOnboarded: true });

  // Validación en servidor: solo ítems conocidos y valores 0..4.
  const answers: Answers = {};
  for (const id of QUESTION_IDS) {
    const v = clampAnswer(raw?.[id]);
    if (v === null) return { ok: false, error: "missing" };
    answers[id] = v;
  }

  // Datos de "Sobre ti" (columnas que la persona puede editar).
  const patch: Record<string, unknown> = {};
  const name = extras.displayName?.trim().slice(0, 40);
  if (name) patch.display_name = name;
  if (extras.timezone && isValidTimeZone(extras.timezone)) patch.timezone = extras.timezone;
  if (typeof extras.endOfDayCheckin === "boolean") patch.end_of_day_checkin = extras.endOfDayCheckin;
  if (Number.isInteger(extras.checkinHour) && extras.checkinHour! >= 0 && extras.checkinHour! <= 23)
    patch.checkin_hour = extras.checkinHour;
  if (Object.keys(patch).length) await supabase.from("profiles").update(patch).eq("id", userId);

  const result = scoreAssessment(answers);

  // La persona puede ajustar sus temas; la principal es la de mayor puntuación entre las elegidas.
  let activeAreas = result.activeAreas;
  if (Array.isArray(extras.chosenAreas)) {
    activeAreas = AREAS.filter((a) => extras.chosenAreas!.includes(a));
  }
  const primaryArea = activeAreas.reduce<Area | null>(
    (best, a) => (best === null || result.scores.areas[a] > result.scores.areas[best] ? a : best),
    null,
  );

  const { error } = await supabase.from("assessments").insert({
    user_id: userId,
    raw_answers: answers,
    scores: result.scores,
    primary_area: primaryArea,
    active_areas: activeAreas,
  });
  if (error) return { ok: false, error: "save" };

  const { data: earned } = await supabase.rpc("award_points", { p_type: "assessment" });
  revalidatePath("/", "layout");

  return { ok: true, primaryArea, activeAreas, pointsEarned: typeof earned === "number" ? earned : 0 };
}
