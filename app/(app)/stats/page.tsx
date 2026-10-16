import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { partsInTz, safeTz } from "@/lib/dates";
import { AREAS, type ActivityType, type Area } from "@/lib/types";
import { AREA_EMOJI } from "@/config/areas";
import { DATE_LOCALE, fmt } from "@/lib/i18n/config";
import { EMOTIONS } from "@/config/emotions";
import type { AssessmentScores } from "@/lib/scoring";
import { MoodLine, type MoodPoint } from "@/components/stats/MoodLine";
import { BarList } from "@/components/stats/BarList";
import { Card, CardTitle } from "@/components/ui/Card";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.stats };
}

const ACTIVITY_ICONS: Partial<Record<ActivityType, string>> = {
  breathing: "🫧",
  grounding: "🌍",
  checkin: "🌡️",
  emotion: "🫙",
  pomodoro: "🍅",
  challenge: "🌱",
  journal: "🎈",
  story: "📖",
  module: "🧩",
  chat: "💬",
};

export default async function StatsPage() {
  const { supabase, profile } = await requireProfile();
  const { t, locale } = await getI18n();
  const st = t.stats;
  const dl = DATE_LOCALE[locale];
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
    label: t.emotions[e.key],
    icon: e.emoji,
    value: (emotions ?? []).filter((x) => x.emotion === e.key).length,
  }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);

  const actCounts = new Map<string, number>();
  for (const a of activities ?? []) actCounts.set(a.type, (actCounts.get(a.type) ?? 0) + 1);
  const selfCare = [...actCounts.entries()]
    .filter(([k]) => ACTIVITY_ICONS[k as ActivityType])
    .map(([k, n]) => ({ key: k, label: st.activities[k] ?? k, icon: ACTIVITY_ICONS[k as ActivityType]!, value: n }))
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
  if (recent !== null && before !== null && recent - before >= 0.3) wins.push(st.winMood);
  for (const a of lighter) wins.push(fmt(st.winLighter, { emoji: AREA_EMOJI[a], label: t.areas[a].label }));
  if (selfCareTotal >= 5) wins.push(fmt(st.winSelfCare, { n: selfCareTotal }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black">{st.title}</h1>
        <p className="text-muted">{st.subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { n: points.length, label: st.tiles.checkins },
          { n: (emotions ?? []).length, label: st.tiles.emotions },
          { n: selfCareTotal, label: st.tiles.selfCare },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl bg-surface p-3 text-center">
            <p className="text-3xl font-black tabular-nums text-accent">{s.n}</p>
            <p className="text-xs font-bold leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {wins.length > 0 && (
        <Card className="bg-surface-2">
          <CardTitle>{st.winsTitle}</CardTitle>
          <ul className="mt-2 flex flex-col gap-1">
            {wins.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>{st.moodTitle}</CardTitle>
        {points.length === 0 ? (
          <p className="mt-2 text-muted">
            {st.moodEmpty}{" "}
            <Link href="/home" className="font-bold text-accent underline">
              {st.moodEmptyLink}
            </Link>
          </p>
        ) : (
          <div className="mt-3">
            <MoodLine points={points} fromDay={partsInTz(since30, tz).ymd} toDay={partsInTz(now, tz).ymd} />
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>{st.emotionsTitle}</CardTitle>
        <p className="mb-3 text-sm text-muted">{st.emotionsSub}</p>
        {emotionItems.length ? (
          <BarList items={emotionItems} ariaLabel={st.emotionsAria} />
        ) : (
          <p className="text-muted">
            {st.jarEmptyA}{" "}
            <Link href="/jarra" className="font-bold text-accent underline">
              {st.jarEmptyLink}
            </Link>{" "}
            {st.jarEmptyB}
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>{st.selfCareTitle}</CardTitle>
        <p className="mb-3 text-sm text-muted">{st.last30}</p>
        {selfCare.length ? (
          <BarList items={selfCare} ariaLabel={st.selfCareAria} />
        ) : (
          <p className="text-muted">{st.selfCareEmpty}</p>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <CardTitle>{st.topicsTitle}</CardTitle>
          <p className="mb-3 text-sm text-muted">
            {st.topicsSub}
          </p>
          <ol className="flex flex-col gap-4">
            {history
              .slice(-6)
              .reverse()
              .map((h) => (
                <li key={h.date}>
                  <p className="mb-1 text-sm font-extrabold capitalize">
                    {new Date(h.date).toLocaleDateString(dl, { month: "long", year: "numeric", timeZone: tz })}
                  </p>
                  <BarList
                    max={100}
                    unit="%"
                    ariaLabel={fmt(st.reviewAria, { date: new Date(h.date).toLocaleDateString(dl, { timeZone: tz }) })}
                    items={AREAS.map((a) => ({
                      key: a,
                      label: t.areas[a].short,
                      icon: AREA_EMOJI[a],
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
