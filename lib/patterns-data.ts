import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeStudyPatterns, type StudyPatterns } from "./patterns";

/** Días de historial que se analizan. */
const HISTORY_DAYS = 120;

/** Carga los datos de la persona (RLS: solo los suyos) y calcula sus patrones de estudio. */
export async function loadStudyPatterns(supabase: SupabaseClient, timeZone: string): Promise<StudyPatterns> {
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000);
  const sinceIso = since.toISOString();
  const [{ data: items }, { data: moods }, { data: emotions }] = await Promise.all([
    supabase.from("exams").select("title, due_date").gte("due_date", sinceIso.slice(0, 10)).order("due_date").limit(300),
    supabase.from("mood_checkins").select("mood, created_at").gte("created_at", sinceIso).limit(1000),
    supabase.from("emotions").select("emotion, created_at").gte("created_at", sinceIso).limit(2000),
  ]);
  return analyzeStudyPatterns({ items: items ?? [], moods: moods ?? [], emotions: emotions ?? [], timeZone });
}
