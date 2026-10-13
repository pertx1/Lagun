"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { QUESTION_IDS } from "@/lib/questionnaire";
import { clampAnswer, scoreAssessment, type Answers } from "@/lib/scoring";
import type { Area } from "@/lib/types";

export interface SubmitResult {
  ok: boolean;
  error?: string;
  primaryArea?: Area | null;
  activeAreas?: Area[];
  safetyFlag?: boolean;
  pointsEarned?: number;
}

export async function submitAssessment(raw: Answers): Promise<SubmitResult> {
  const { supabase, userId } = await requireProfile({ allowNotOnboarded: true });

  // Validación en servidor: solo ítems conocidos y valores 0..4.
  const answers: Answers = {};
  for (const id of QUESTION_IDS) {
    const v = clampAnswer(raw?.[id]);
    if (v === null) return { ok: false, error: "Falta alguna respuesta." };
    answers[id] = v;
  }

  const result = scoreAssessment(answers);
  const { error } = await supabase.from("assessments").insert({
    user_id: userId,
    raw_answers: answers,
    scores: result.scores,
    primary_area: result.primaryArea,
    active_areas: result.activeAreas,
  });
  if (error) return { ok: false, error: "No hemos podido guardar tus respuestas. Inténtalo de nuevo." };

  const { data: earned } = await supabase.rpc("award_points", { p_type: "assessment" });
  revalidatePath("/", "layout");

  return {
    ok: true,
    primaryArea: result.primaryArea,
    activeAreas: result.activeAreas,
    safetyFlag: result.safetyFlag,
    pointsEarned: typeof earned === "number" ? earned : 0,
  };
}
