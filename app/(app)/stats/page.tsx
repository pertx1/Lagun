import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { partsInTz, safeTz } from "@/lib/dates";
import { AREAS, type ActivityType, type Area } from "@/lib/types";
import { AREA_INFO } from "@/config/areas";
import { EMOTIONS } from "@/config/emotions";
import type { AssessmentScores } from "@/lib/scoring";
import { MoodLine, type MoodPoint } from "@/components/stats/MoodLine";
import { BarList } from "@/components/stats/BarList";
import { Card, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Tu progreso" };

const ACTIVITY_LABELS: Partial<Record<ActivityType, { label: string; icon: string }>> = {
  breathing: { label: "Respiración", icon: "🫧" },
  grounding: { label: "Grounding", icon: "🌍" },
  checkin: { label: "Check-ins", icon: "🌡️" },
  emotion: { label: "Emociones", icon: "🫙" },
  pomodoro: { label: "Pomodoros", icon: "🍅" },
  challenge: { label: "Retos", icon: "🌱" },
  journal: { label: "Desahogos", icon: "🎈" },
  story: { label: "Lecturas", icon: "📖" },
  module: { label: "Ejercicios", icon: "🧩" },
  chat: { label: "Charlas", icon: "💬" },
};

export default async function StatsPage() {
  const { supabase, profile } = await requireProfile();
  const tz = safeTz(profile.timezone);
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 86_400_000);
  const since60 = new Date(now.getTime() - 60 * 86_400_000);

  const [{ data: moods }, { data: emotions }, { data: activities }, { data: assessments }] = await Promise.all([
    supabase.from("mood_checkins").select("mood, created_at").gte("created_at", since60.toISOString()).order("created_at"),
    supabase.from("emotions").select("emotion, created_at").gte("created_at", since30.toISOString()),
    supabase.from("activities").select("type, created_at").gte("created_at", since30.toISOString()),
    supabase.from("assessments").select("taken_at, scores, primary_area").order("taken_at"),
  ]);

  // Ánimo: media por día (últimos 30 días).
  const byDay = new Map<string, number[]>();
  for (const m of moods ?? []) {
    if (new Date(m.created_at) < since30) continue;
    const day = partsInTz(new Date(m.created_at), tz).ymd;
    byDay.set(day, [...(byDay.get(day) ?? []), m.mood]);
  }
  const points: MoodPoint[] = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, mood: v.reduce((s, x) => s + x, 0) / v.length }));

  // Pequeñas mejoras: últimas 2 semanas vs las 2 anteriores.
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const t14 = now.getTime() - 14 * 86_400_000;
  const t28 = now.getTime() - 28 * 86_400_000;
  const recent = avg((moods ?? []).filter((m) => Date.parse(m.created_at) >= t14).map((m) => m.mood));
  const before = avg((moods ?? []).filter((m) => Date.parse(m.created_at) >= t28 && Date.parse(m.created_at) < t14).map((m) => m.mood));

  const emotionItems = EMOTIONS.map((e) => ({
    key: e.key,
    label: e.label,
    icon: e.emoji,
    value: (emotions ?? []).filter((x) => x.emotion === e.key).length,
  }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);

  const actCounts = new Map<string, number>();
  for (const a of activities ?? []) actCounts.set(a.type, (actCounts.get(a.type) ?? 0) + 1);
  const selfCare = [...actCounts.entries()]
    .filter(([t]) => ACTIVITY_LABELS[t as ActivityType])
    .map(([t, n]) => ({ key: t, label: ACTIVITY_LABELS[t as ActivityType]!.label, icon: ACTIVITY_LABELS[t as ActivityType]!.icon, value: n }))
    .sort((a, b) => b.value - a.value);
  const selfCareTotal = selfCare.reduce((s, x) => s + x.value, 0);

  const history = (assessments ?? []).map((a) => ({
    date: a.taken_at as string,
    areas: (a.scores as AssessmentScores).areas,
  }));
  const last = history.at(-1);
  const prev = history.at(-2);
  const lighter: Area[] = last && prev ? AREAS.filter((a) => prev.areas[a] - last.areas[a] >= 0.1) : [];

  const wins: string[] = [];
  if (recent !== null && before !== null && recent - before >= 0.3) wins.push("Tu ánimo de estas dos semanas está un poco mejor que el de las anteriores. 🌤️");
  for (const a of lighter) wins.push(`${AREA_INFO[a].emoji} ${AREA_INFO[a].label} te pesa menos que en tu revisión anterior.`);
  if (selfCareTotal >= 5) wins.push(`Este mes has dedicado ${selfCareTotal} ratitos a cuidarte. Eso cuenta, y mucho.`);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black">Tu progreso</h1>
        <p className="text-muted">No es una nota: es un mapa de cómo te has ido sintiendo. Todo lo que ves aquí lo has hecho tú.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { n: points.length, label: "días con check-in", sub: "últimos 30 días" },
          { n: (emotions ?? []).length, label: "emociones guardadas", sub: "últimos 30 días" },
          { n: selfCareTotal, label: "ratitos de autocuidado", sub: "últimos 30 días" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl bg-surface p-3 text-center">
            <p className="text-3xl font-black tabular-nums text-accent">{s.n}</p>
            <p className="text-xs font-bold leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {wins.length > 0 && (
        <Card className="bg-surface-2">
          <CardTitle>✨ Pequeñas mejoras</CardTitle>
          <ul className="mt-2 flex flex-col gap-1">
            {wins.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Tu ánimo (últimos 30 días)</CardTitle>
        {points.length === 0 ? (
          <p className="mt-2 text-muted">
            Cuando hagas algún check-in, aquí verás cómo va cambiando tu ánimo. Sin prisa.{" "}
            <Link href="/home" className="font-bold text-accent underline">Hacer uno ahora</Link>
          </p>
        ) : (
          <div className="mt-3">
            <MoodLine points={points} fromDay={partsInTz(since30, tz).ymd} toDay={partsInTz(now, tz).ymd} />
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Emociones que has guardado</CardTitle>
        <p className="mb-3 text-sm text-muted">Últimos 30 días. Todas valen.</p>
        {emotionItems.length ? (
          <BarList items={emotionItems} ariaLabel="Número de veces por emoción" />
        ) : (
          <p className="text-muted">
            Tu <Link href="/jarra" className="font-bold text-accent underline">jarra</Link> está esperando su primera bola.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>Ratitos de autocuidado</CardTitle>
        <p className="mb-3 text-sm text-muted">Últimos 30 días.</p>
        {selfCare.length ? (
          <BarList items={selfCare} ariaLabel="Ejercicios de autocuidado por tipo" />
        ) : (
          <p className="text-muted">Cuando respires, hagas un reto o un pomodoro, aparecerá aquí.</p>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <CardTitle>Cómo han cambiado tus temas</CardTitle>
          <p className="mb-3 text-sm text-muted">
            Según tus revisiones. Barra más corta = ese tema te pesaba menos. Se conservan todas.
          </p>
          <ol className="flex flex-col gap-4">
            {history
              .slice(-6)
              .reverse()
              .map((h) => (
                <li key={h.date}>
                  <p className="mb-1 text-sm font-extrabold capitalize">
                    {new Date(h.date).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: tz })}
                  </p>
                  <BarList
                    max={100}
                    unit="%"
                    ariaLabel={`Revisión de ${new Date(h.date).toLocaleDateString("es-ES", { timeZone: tz })}`}
                    items={AREAS.map((a) => ({
                      key: a,
                      label: AREA_INFO[a].short,
                      icon: AREA_INFO[a].emoji,
                      value: Math.round((h.areas?.[a] ?? 0) * 100),
                    }))}
                  />
                </li>
              ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
