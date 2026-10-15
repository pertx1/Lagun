import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { isReassessmentDue } from "@/lib/scoring";
import { getResources } from "@/config/safety";
import { Questionnaire } from "./Questionnaire";
import { ThemeSync } from "@/components/ui/ThemeSync";

export const metadata: Metadata = { title: "Conocernos" };

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
