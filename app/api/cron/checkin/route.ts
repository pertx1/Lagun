import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { partsInTz, safeTz } from "@/lib/dates";
import { sendPush } from "@/lib/push";
import { DICTS, isLocale } from "@/lib/i18n";

/**
 * Cron horario (vercel.json). Envía el recordatorio del check-in de fin de día SOLO a quien:
 *   - lo tiene activado, ha activado notificaciones,
 *   - hoy es uno de sus días elegidos y es su hora local,
 *   - y no ha hecho ya un check-in hoy.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  type Row = { id: string; timezone: string; checkin_hour: number; checkin_days: number[]; locale?: string };
  const query = (cols: string) =>
    admin.from("profiles").select(cols).eq("end_of_day_checkin", true).eq("notifications_enabled", true).returns<Row[]>();
  let { data: profiles, error } = await query("id, timezone, checkin_hour, checkin_days, locale");
  // Sin la migración de idiomas, la columna locale no existe todavía: se envía en castellano.
  if (error) ({ data: profiles, error } = await query("id, timezone, checkin_hour, checkin_days"));
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  const now = new Date();
  const due = (profiles ?? []).filter((p) => {
    const local = partsInTz(now, safeTz(p.timezone));
    return local.hour === p.checkin_hour && (p.checkin_days as number[]).includes(local.weekday);
  });

  let sent = 0;
  for (const p of due) {
    const tz = safeTz(p.timezone);
    const { data: last } = await admin
      .from("mood_checkins")
      .select("created_at")
      .eq("user_id", p.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last && partsInTz(new Date(last.created_at), tz).ymd === partsInTz(now, tz).ymd) continue;

    const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", p.id);
    const locale = p.locale;
    const push = DICTS[isLocale(locale) ? locale : "es"].push;
    const body = push.checkin[now.getUTCDate() % push.checkin.length];
    for (const s of subs ?? []) {
      const r = await sendPush(s, { title: push.title, body, url: "/home", tag: "checkin" });
      if (r === "ok") sent++;
      if (r === "gone") await admin.from("push_subscriptions").delete().eq("id", s.id);
    }
  }

  return NextResponse.json({ candidates: due.length, sent });
}
