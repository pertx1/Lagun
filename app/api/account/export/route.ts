import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Derecho de acceso y portabilidad (RGPD): descarga todos tus datos. */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const tables = ["profiles", "assessments", "emotions", "mood_checkins", "activities", "user_inventory", "favorites", "exams", "push_subscriptions"] as const;
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), note: "El chat no se guarda, por eso no aparece." };
  for (const t of tables) {
    const { data } = await supabase.from(t).select("*");
    out[t] = data ?? [];
  }

  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lagun-mis-datos.json"`,
      "Cache-Control": "no-store",
    },
  });
}
