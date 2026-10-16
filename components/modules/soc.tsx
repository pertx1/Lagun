"use client";

import { useI18n } from "@/lib/i18n/client";
import { TipList } from "./ModuleCard";
import { GentleChallenge } from "./GentleChallenge";
import { Situations } from "./Situations";
import { VentSpace } from "./VentSpace";

/** Reto amable */
export function ChallengeTool() {
  return <GentleChallenge />;
}

/** Situaciones de ejemplo */
export function SituationsTool() {
  return <Situations items={useI18n().t.soc.situations} />;
}

/** Habilidades sociales */
export function SocialSkills() {
  return <TipList tips={useI18n().t.soc.skills} />;
}

/** Para desahogarte */
export function VentTool() {
  return <VentSpace />;
}
