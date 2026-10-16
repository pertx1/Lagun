"use client";

import { useI18n } from "@/lib/i18n/client";
import { TipList } from "./ModuleCard";
import { IMessageBuilder } from "./IMessageBuilder";

/** Comunicación en casa */
export function CommunicationTool() {
  return <IMessageBuilder />;
}

/** Límites sanos y conflictos */
export function LimitsTool() {
  return <TipList tips={useI18n().t.fam.limits} />;
}

/** Si en casa pasa algo grave */
export function FamilyHelpNote() {
  const { t } = useI18n();
  return (
    <p className="rounded-2xl bg-bg p-4 text-sm">
      {t.fam.helpA} <strong>{t.fam.helpB}</strong> {t.fam.helpC}
    </p>
  );
}
