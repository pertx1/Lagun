"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isValidUsername, normalizeUsername, usernameToAuthEmail } from "@/lib/username";
import { getI18n } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n";

export interface FormState {
  error?: string;
}

type AuthErrors = Dict["auth"]["errors"];

function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function missingVars() {
  return ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter((k) => !process.env[k]).join(", ");
}

/** Cliente admin solo si hay service role; sin ella se usa el registro normal. */
function adminOrNull() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
}

/** Traduce un error de Supabase Auth a un mensaje para la persona y lo deja en los logs. */
function explain(where: string, err: { message?: string; code?: string; status?: number }, e: AuthErrors) {
  console.error(`[auth:${where}]`, err.code ?? "", err.status ?? "", err.message ?? "");
  const text = `${err.code ?? ""} ${err.message ?? ""}`;
  if (/already|registered|exists/i.test(text)) return e.taken;
  if (/database error|relation .* does not exist|profiles/i.test(text)) return e.database;
  if (/invalid api key|no api key/i.test(text)) return `${e.config} (clave no válida)`;
  if (/fetch failed|ENOTFOUND/i.test(text)) return `${e.config} (no responde la URL)`;
  return `${e.generic} (${err.code ?? err.message ?? "error"})`;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  const { t } = await getI18n();
  const e = t.auth.errors;
  if (!username || !password) return { error: e.missing };
  if (!supabaseConfigured()) return { error: `${e.config} (${missingVars()})` };

  const email = usernameToAuthEmail(username);
  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({ email, password });

  // Cuentas creadas con "Confirm email" activado: se confirman aquí, porque
  // el email es técnico y nunca llega ningún correo.
  if (error?.code === "email_not_confirmed") {
    const admin = adminOrNull();
    if (admin) {
      const { data: profile } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
      if (profile?.id) {
        await admin.auth.admin.updateUserById(profile.id, { email_confirm: true });
        ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      }
    }
  }

  if (error) {
    if (error.code === "invalid_credentials" || /invalid login/i.test(error.message)) return { error: e.bad };
    return { error: explain("login", error, e) };
  }
  redirect("/home");
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  const ageConsent = form.get("age_consent") === "on";
  const timezone = String(form.get("timezone") ?? "Europe/Madrid").slice(0, 64);
  const { t, locale } = await getI18n();
  const e = t.auth.errors;

  if (!isValidUsername(username)) return { error: e.username };
  if (password.length < 8) return { error: e.password };
  if (!ageConsent) return { error: e.consent };
  if (!supabaseConfigured()) return { error: `${e.config} (${missingVars()})` };

  const email = usernameToAuthEmail(username);
  const metadata = { username, age_consent: true, timezone, locale };
  const supabase = await createClient();
  const admin = adminOrNull();

  if (admin) {
    // Con service role la cuenta nace confirmada: no depende de "Confirm email"
    // ni de que Supabase acepte enviar correos al dominio técnico.
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) return { error: explain("register", error, e) };
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) return { error: explain("register-login", loginError, e) };
  } else {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    if (error) return { error: explain("signup", error, e) };
    if (!data.session) return { error: e.noSession };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
