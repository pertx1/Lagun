import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isReassessmentDue } from "@/lib/scoring";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { BottomNav } from "@/components/ui/BottomNav";
import { ThemeSync } from "@/components/ui/ThemeSync";
import { Frog } from "@/components/Frog/Frog";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, profile } = await requireProfile();

  // Re-evaluación mensual OBLIGATORIA: a los 30 días se pide repetir el cuestionario.
  // Las estadísticas históricas no se tocan. (La ayuda urgente sigue siempre accesible.)
  const { data: last } = await supabase
    .from("assessments")
    .select("taken_at")
    .order("taken_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (isReassessmentDue(last?.taken_at ?? profile.onboarded_at)) redirect("/onboarding");
  const { t } = await getI18n();
  return (
    <>
      <ThemeSync theme={profile.theme} />
      <header
        className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-xl items-center gap-2 pl-4 pr-28">
          <Link href="/home" className="text-xl font-black tracking-tight text-accent">
            Lagun
          </Link>
          <Link
            href="/shop"
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-sm font-bold"
            aria-label={fmt(t.nav.shopAria, { n: profile.points })}
          >
            <Frog state={profile.frog_state} size={26} animate={false} label="" />
            <span aria-hidden>🍃 {profile.points}</span>
          </Link>
          <Link href="/settings" className="rounded-full p-2 text-lg" aria-label={t.nav.settings}>
            <span aria-hidden>⚙️</span>
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-5">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
