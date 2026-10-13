import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Usuario + perfil de la petición actual (memorizado por petición). */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return { supabase, userId: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single<Profile>();
  return { supabase, userId, profile };
});

/** Exige sesión y perfil; si no ha hecho el cuestionario, lo manda al onboarding. */
export async function requireProfile(opts: { allowNotOnboarded?: boolean } = {}) {
  const s = await getSession();
  if (!s.userId || !s.profile) redirect("/login");
  if (!opts.allowNotOnboarded && !s.profile.onboarded_at) redirect("/onboarding");
  return { supabase: s.supabase, userId: s.userId, profile: s.profile };
}
