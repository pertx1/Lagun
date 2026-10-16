import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanion, sanitizeHistory, type CompanionContext } from "@/lib/ai";
import { CRISIS_FALLBACK_REPLY, detectCrisis } from "@/lib/safety";
import type { Area } from "@/lib/types";
import { describeUser, isChatTopic, type ChatTopic } from "@/lib/companion-knowledge";
import { EMOTION_BY_KEY, type EmotionKey } from "@/config/emotions";
import { daysUntil, partsInTz, safeTz } from "@/lib/dates";

/**
 * Chat con IA. EFÍMERO: no se guarda ni se registra el contenido.
 * Doble red de seguridad: flag `crisis` del modelo + detección por palabras clave.
 */

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

// Límite de ritmo sencillo en memoria (por instancia). Suficiente como freno básico.
const hits = new Map<string, number[]>();
function rateLimited(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > 15;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401, headers: NO_STORE });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición no válida" }, { status: 400, headers: NO_STORE });
  }

  const history = sanitizeHistory((body as { messages?: unknown })?.messages);
  const rawTopic = (body as { topic?: unknown })?.topic;
  const topic: ChatTopic = isChatTopic(rawTopic) ? rawTopic : "general";
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400, headers: NO_STORE });

  // Red de seguridad por palabras clave (independiente del modelo).
  const keyword = detectCrisis(lastUser.content);

  if (rateLimited(userId)) {
    return NextResponse.json(
      {
        reply: keyword.crisis
          ? CRISIS_FALLBACK_REPLY
          : "Vamos un poquito más despacio, que me cuesta seguirte. Espera unos segundos y seguimos. 🐸",
        crisis: keyword.crisis,
      },
      { headers: NO_STORE },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, primary_area, active_areas, timezone")
    .eq("id", userId)
    .single();

  // Personalización: resumen de la última semana (sin notas privadas) + contenido de Lagun del tema.
  const tz = safeTz(profile?.timezone);
  const today = partsInTz(new Date(), tz).ymd;
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ data: moods }, { data: emotions }, { data: exams }, { data: posts }] = await Promise.all([
    supabase.from("mood_checkins").select("mood").gte("created_at", weekAgo),
    supabase.from("emotions").select("emotion").gte("created_at", weekAgo),
    topic === "acad" || topic === "general"
      ? supabase.from("exams").select("title, due_date").gte("due_date", today).order("due_date").limit(5)
      : Promise.resolve({ data: [] as { title: string; due_date: string }[] }),
    supabase
      .from("feed_posts")
      .select("type, title, body")
      .eq("area", topic)
      .in("type", ["consejo", "historia"])
      .limit(8),
  ]);

  const moodList = (moods ?? []).map((m) => m.mood as number);
  const emotionCounts = new Map<string, number>();
  for (const e of emotions ?? []) emotionCounts.set(e.emotion, (emotionCounts.get(e.emotion) ?? 0) + 1);
  const userSummary = describeUser({
    moodAvg7d: moodList.length ? moodList.reduce((a, b) => a + b, 0) / moodList.length : null,
    topEmotions7d: [...emotionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => EMOTION_BY_KEY[k as EmotionKey]?.label.toLowerCase() ?? k),
    upcomingExams: (exams ?? [])
      .map((e) => ({ title: e.title as string, inDays: daysUntil(e.due_date as string, today) }))
      .filter((e) => e.inDays <= 14),
    activeAreas: (profile?.active_areas as Area[] | undefined) ?? [],
  });
  const appContent = (posts ?? []).map((p) => `- ${p.title}: ${p.body}`).join("\n");

  const context: CompanionContext = {
    displayName: profile?.display_name,
    primaryArea: (profile?.primary_area as Area | null) ?? null,
    topic,
    userSummary,
    appContent,
  };

  let reply = "";
  let modelCrisis = false;
  try {
    const out = await getCompanion().reply(history, context);
    reply = out.reply;
    modelCrisis = out.crisis;
  } catch {
    // Sin registrar el contenido. Seguimos con una respuesta segura.
    reply = "";
  }

  const crisis = modelCrisis || keyword.crisis;
  if (!reply) {
    reply = crisis
      ? CRISIS_FALLBACK_REPLY
      : "Perdona, ahora mismo me he quedado sin palabras (algo ha fallado por mi lado). ¿Me lo vuelves a contar en un momento?";
  }

  return NextResponse.json({ reply, crisis }, { headers: NO_STORE });
}
