"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

/** Cambia el idioma: cookie (para páginas públicas) + perfil (si hay sesión). */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return { ok: false };
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  const { supabase, userId } = await getSession();
  if (userId) await supabase.from("profiles").update({ locale }).eq("id", userId);
  revalidatePath("/", "layout");
  return { ok: true };
}
