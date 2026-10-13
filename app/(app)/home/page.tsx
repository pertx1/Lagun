import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { partsInTz, safeTz, daysBetween, greeting } from "@/lib/dates";
import { AREAS, type Area, type Exam } from "@/lib/types";
import { AREA_INFO } from "@/config/areas";
import { getResources } from "@/config/safety";
import { Frog } from "@/components/Frog/Frog";
import { moodFromScore } from "@/components/Frog/palette";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { MoodCheckin } from "@/components/modules/MoodCheckin";
import { BreathingExercise } from "@/components/modules/BreathingExercise";
import { Grounding } from "@/components/modules/Grounding";
import { AcadModule } from "@/components/modules/AcadModule";
import { SocModule } from "@/components/modules/SocModule";
import { FamModule } from "@/components/modules/FamModule";
import { IdenModule } from "@/components/modules/IdenModule";

export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage() {
  const { supabase, profile } = await requireProfile();
  const tz = safeTz(profile.timezone);
  const now = new Date();
  const local = partsInTz(now, tz);

  const [{ data: lastMood }, { data: lastActivity }, { data: exams }] = await Promise.all([
    supabase.from("mood_checkins").select("mood, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("activities").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("exams").select("id, subject, title, due_date").gte("due_date", local.ymd).order("due_date").limit(20),
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

  const resources = getResources(profile.country);
  const ordered: Area[] = profile.primary_area
    ? [profile.primary_area, ...profile.active_areas.filter((a) => a !== profile.primary_area)]
    : profile.active_areas;
  const others = AREAS.filter((a) => !ordered.includes(a));
  const frogMood = checkedInToday && lastMood ? moodFromScore(lastMood.mood) : "happy";

  const renderArea = (a: Area) => {
    switch (a) {
      case "acad":
        return <AcadModule exams={(exams ?? []) as Exam[]} today={local.ymd} />;
      case "soc":
        return <SocModule />;
      case "fam":
        return <FamModule resources={resources} />;
      case "iden":
        return <IdenModule resources={resources} />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center gap-4" aria-labelledby="hello">
        <Link href="/shop" aria-label="Ver y personalizar a Igel">
          <Frog state={profile.frog_state} mood={frogMood} size={104} withCorner label="" />
        </Link>
        <div>
          <h1 id="hello" className="text-2xl font-black leading-tight">
            {greeting(local.hour)}, {profile.display_name}
          </h1>
          <p className="text-muted">
            {welcomeBack
              ? "¡Qué alegría verte! Tu rincón te estaba esperando, tal cual lo dejaste. 💚"
              : "Estoy aquí para lo que necesites."}
          </p>
        </div>
      </section>

      {showEndOfDay && (
        <div className="rounded-3xl border-2 border-primary bg-surface p-5 animate-fade-up">
          <MoodCheckin question="🌙 ¿Qué tal ha ido el día?" />
        </div>
      )}

      <section aria-labelledby="now-h" className="flex flex-col gap-3">
        <h2 id="now-h" className="text-xl font-extrabold">
          ¿Qué te apetece ahora?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/jarra", icon: "🫙", label: "Guardar una emoción" },
            { href: "/chat", icon: "💬", label: "Hablar con Igel" },
            { href: "#respirar", icon: "🫧", label: "Respirar un minuto" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-1 rounded-3xl border border-line bg-surface p-3 text-center text-sm font-bold hover:bg-surface-2"
            >
              <span aria-hidden className="text-3xl">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {!showEndOfDay && (
        <ModuleCard emoji="🌡️" title="Check-in" subtitle="Cuando quieras, las veces que quieras. Nunca es obligatorio.">
          <MoodCheckin />
        </ModuleCard>
      )}

      {ordered.map((a) => (
        <section key={a} aria-labelledby={`area-${a}`} className="flex flex-col gap-3">
          <h2 id={`area-${a}`} className="text-xl font-extrabold">
            <span aria-hidden>{AREA_INFO[a].emoji}</span> {AREA_INFO[a].label}
          </h2>
          {renderArea(a)}
        </section>
      ))}

      <div id="respirar" className="scroll-mt-20">
        <ModuleCard emoji="🫧" title="Respira conmigo" subtitle="Inspira 4, aguanta 4, suelta 6.">
          <BreathingExercise />
        </ModuleCard>
      </div>

      <ModuleCard emoji="🌍" title="Volver al presente" subtitle="Ejercicio de grounding 5-4-3-2-1.">
        <Grounding />
      </ModuleCard>

      {others.length > 0 && (
        <details className="rounded-3xl border border-line p-4">
          <summary className="cursor-pointer text-lg font-extrabold">Explorar otros temas</summary>
          <div className="mt-4 flex flex-col gap-6">
            {others.map((a) => (
              <section key={a} aria-labelledby={`other-${a}`} className="flex flex-col gap-3">
                <h2 id={`other-${a}`} className="text-lg font-extrabold">
                  <span aria-hidden>{AREA_INFO[a].emoji}</span> {AREA_INFO[a].label}
                </h2>
                {renderArea(a)}
              </section>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
