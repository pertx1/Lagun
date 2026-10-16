import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { partsInTz, safeTz, daysBetween, dayPart } from "@/lib/dates";
import { AREA_EMOJI } from "@/config/areas";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { loadStudyPatterns } from "@/lib/patterns-data";
import { Frog } from "@/components/Frog/Frog";
import { moodFromScore } from "@/components/Frog/palette";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { MoodCheckin } from "@/components/modules/MoodCheckin";
import { BreathingExercise } from "@/components/modules/BreathingExercise";
import { Grounding } from "@/components/modules/Grounding";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.home };
}

export default async function HomePage() {
  const { supabase, profile } = await requireProfile();
  const { t } = await getI18n();
  const h = t.home;
  const tz = safeTz(profile.timezone);
  const now = new Date();
  const local = partsInTz(now, tz);

  const [{ data: lastMood }, { data: lastActivity }, patterns] = await Promise.all([
    supabase.from("mood_checkins").select("mood, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("activities").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    loadStudyPatterns(supabase, tz, t),
  ]);

  const checkedInToday = lastMood ? partsInTz(new Date(lastMood.created_at), tz).ymd === local.ymd : false;
  const showEndOfDay =
    profile.end_of_day_checkin &&
    profile.checkin_days.includes(local.weekday) &&
    local.hour >= profile.checkin_hour &&
    !checkedInToday;

  const lastSeen = [lastMood?.created_at, lastActivity?.created_at].filter(Boolean).map((d) => new Date(d!));
  const lastSeenAt = lastSeen.length ? new Date(Math.max(...lastSeen.map((d) => d.getTime()))) : null;
  const welcomeBack = lastSeenAt && daysBetween(lastSeenAt, now) >= 10;

  const frogMood = checkedInToday && lastMood ? moodFromScore(lastMood.mood) : "happy";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center gap-4" aria-labelledby="hello">
        <Link href="/shop" aria-label={h.frogAria}>
          <Frog state={profile.frog_state} mood={frogMood} size={104} withCorner label="" />
        </Link>
        <div>
          <h1 id="hello" className="text-2xl font-black leading-tight">
            {h.greeting[dayPart(local.hour)]}, {profile.display_name}
          </h1>
          <p className="text-muted">
            {welcomeBack ? h.welcomeBack : h.here}
          </p>
        </div>
      </section>

      {showEndOfDay && (
        <div className="rounded-3xl border-2 border-primary bg-surface p-5 animate-fade-up">
          <MoodCheckin question={h.endOfDay} />
        </div>
      )}

      <section aria-labelledby="now-h" className="flex flex-col gap-3">
        <h2 id="now-h" className="text-xl font-extrabold">
          {h.whatNow}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/jarra", icon: "🫙", label: h.tiles.jar },
            { href: "/chat", icon: "💬", label: h.tiles.chat },
            { href: "#respirar", icon: "🫧", label: h.tiles.breathe },
            { href: "/feed", icon: "📰", label: h.tiles.feed },
            { href: "/stats", icon: "📈", label: h.tiles.stats },
            { href: "/shop", icon: "🐸", label: h.tiles.shop },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-3xl border border-line bg-surface p-2 text-center text-sm font-bold leading-tight transition-transform hover:bg-surface-2 active:scale-95"
            >
              <span aria-hidden className="text-3xl">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {patterns.load === "cargada" && (
        <aside aria-label={h.busyAria} className="flex items-center gap-3 rounded-3xl bg-warm p-4">
          <span aria-hidden className="text-3xl">🗓️</span>
          <div className="flex-1">
            <p className="font-bold">{fmt(h.busyTitle, { n: patterns.upcoming7 })}</p>
            <p className="text-sm">
              {patterns.examMood !== null && patterns.otherMood !== null && patterns.otherMood - patterns.examMood >= 0.5
                ? h.busyHard
                : h.busySoft}
            </p>
          </div>
          <Link href="/chat?tema=acad" className="shrink-0 rounded-2xl bg-primary px-4 py-2 font-bold text-on-primary">
            {h.ok}
          </Link>
        </aside>
      )}

      {profile.active_areas.length > 0 && (
        <nav aria-label={h.yourTopics} className="flex flex-wrap gap-2">
          {profile.active_areas.map((a) => (
            <Link key={a} href={`/area/${a}`} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-bold">
              <span aria-hidden>{AREA_EMOJI[a]}</span> {t.areas[a].label}
            </Link>
          ))}
        </nav>
      )}

      {!showEndOfDay && (
        <ModuleCard emoji="🌡️" title={h.checkinTitle} subtitle={h.checkinSubtitle}>
          <MoodCheckin />
        </ModuleCard>
      )}

      <div id="respirar" className="scroll-mt-20">
        <ModuleCard emoji="🫧" title={h.breatheTitle} subtitle={h.breatheSubtitle}>
          <BreathingExercise />
        </ModuleCard>
      </div>

      <ModuleCard emoji="🌍" title={h.groundingTitle} subtitle={h.groundingSubtitle}>
        <Grounding />
      </ModuleCard>

    </div>
  );
}
