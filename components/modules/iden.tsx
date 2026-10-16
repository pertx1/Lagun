"use client";

import type { CountryResources } from "@/config/safety";
import { pick } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { TipList } from "./ModuleCard";
import { Affirmations } from "./Affirmations";

/** Para recordarte */
export function AffirmationsTool() {
  return <Affirmations />;
}

/** Autoaceptación */
export function SelfAcceptance() {
  return <TipList tips={useI18n().t.iden.acceptance} />;
}

/** Organizaciones de confianza (solo web). */
export function IdentityOrgs({ resources }: { resources: CountryResources }) {
  const { t, locale } = useI18n();
  return (
    <ul className="flex flex-col gap-2">
      {resources.identity
        .filter((r) => r.url)
        .map((r) => (
          <li key={r.name.es} className="rounded-2xl bg-bg p-3">
            <p className="font-bold">{pick(r.name, locale)}</p>
            <p className="text-sm text-muted">{pick(r.description, locale)}</p>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-bold text-accent underline">
              {t.iden.web}
              <span className="sr-only"> {t.common.newTab}</span>
            </a>
          </li>
        ))}
    </ul>
  );
}
