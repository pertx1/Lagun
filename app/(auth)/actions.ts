"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidUsername, normalizeUsername, usernameToAuthEmail } from "@/lib/username";
import { getI18n } from "@/lib/i18n/server";

export interface FormState {
  error?: string;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  const { t } = await getI18n();
  if (!username || !password) return { error: t.auth.errors.missing };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: usernameToAuthEmail(username), password });
  if (error) return { error: t.auth.errors.bad };
  redirect("/home");
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  const ageConsent = form.get("age_consent") === "on";
  const timezone = String(form.get("timezone") ?? "Europe/Madrid").slice(0, 64);
  const { t, locale } = await getI18n();

  if (!isValidUsername(username)) return { error: t.auth.errors.username };
  if (password.length < 8) return { error: t.auth.errors.password };
  if (!ageConsent) return { error: t.auth.errors.consent };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: usernameToAuthEmail(username),
    password,
    options: { data: { username, age_consent: true, timezone, locale } },
  });
  if (error) {
    return {
      error: /registered|exists/i.test(error.message) ? t.auth.errors.taken : t.auth.errors.generic,
    };
  }
  if (!data.session) {
    return { error: t.auth.errors.noSession };
  }
  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
