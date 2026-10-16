import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { DICTS, isLocale, LOCALE_COOKIE, matchAcceptLanguage, type Locale } from "./index";

/** Idioma de la petición: perfil → cookie → navegador → castellano. */
export const getLocale = cache(async (): Promise<Locale> => {
  const { profile } = await getSession();
  const fromProfile = (profile as { locale?: string } | null)?.locale;
  if (isLocale(fromProfile)) return fromProfile;
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return matchAcceptLanguage((await headers()).get("accept-language"));
});

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
}
