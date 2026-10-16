import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { requireProfile } from "@/lib/auth";
import { isReassessmentDue } from "@/lib/scoring";
import { getResources } from "@/config/safety";
import { Questionnaire } from "./Questionnaire";
import { ThemeSync } from "@/components/ui/ThemeSync";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.onboarding };
}

export default async function OnboardingPage() {
  const { supabase, profile } = await requireProfile({ allowNotOnboarded: true });
  const { data: last } = await supabase
    .from("assessments")
    .select("taken_at")
    .order("taken_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const mandatory = Boolean(profile.onboarded_at) && isReassessmentDue(last?.taken_at ?? profile.onboarded_at);
  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <ThemeSync theme={profile.theme} />
      <Questionnaire
        name={profile.display_name}
        isReassessment={Boolean(profile.onboarded_at)}
        mandatory={mandatory}
        resources={getResources(profile.country)}
        frogState={profile.frog_state}
        initialCheckinHour={profile.checkin_hour}
      />
    </main>
  );
}
