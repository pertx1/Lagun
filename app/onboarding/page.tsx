import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getResources } from "@/config/safety";
import { Questionnaire } from "./Questionnaire";
import { ThemeSync } from "@/components/ui/ThemeSync";

export const metadata: Metadata = { title: "Conocernos" };

export default async function OnboardingPage() {
  const { profile } = await requireProfile({ allowNotOnboarded: true });
  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-16">
      <ThemeSync theme={profile.theme} />
      <Questionnaire
        name={profile.display_name}
        isReassessment={Boolean(profile.onboarded_at)}
        resources={getResources(profile.country)}
        frogState={profile.frog_state}
      />
    </main>
  );
}
