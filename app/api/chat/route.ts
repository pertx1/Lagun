import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanion, sanitizeHistory, type CompanionContext } from "@/lib/ai";
import { CRISIS_FALLBACK_REPLY, detectCrisis } from "@/lib/safety";
import type { Area } from "@/lib/types";

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
    .select("display_name, primary_area, is_minor")
    .eq("id", userId)
    .single();

  const context: CompanionContext = {
    displayName: profile?.display_name,
    primaryArea: (profile?.primary_area as Area | null) ?? null,
    isMinor: profile?.is_minor ?? true,
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
