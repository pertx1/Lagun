"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/i18n-actions";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

/** Selector compacto de idioma (páginas públicas). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <nav aria-label={t.common.language} className={`flex flex-wrap justify-center gap-1.5 ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          disabled={pending}
          aria-pressed={locale === l}
          onClick={() =>
            start(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={`rounded-full px-3 py-1 text-sm font-bold ${locale === l ? "bg-primary text-on-primary" : "bg-surface text-fg"}`}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </nav>
  );
}
