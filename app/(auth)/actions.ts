"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidUsername, normalizeUsername, usernameToAuthEmail } from "@/lib/username";

export interface FormState {
  error?: string;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { error: "Escribe tu usuario y tu contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: usernameToAuthEmail(username), password });
  if (error) return { error: "No hemos podido entrar. Revisa el usuario y la contraseña." };
  redirect("/home");
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  const ageConsent = form.get("age_consent") === "on";
  const timezone = String(form.get("timezone") ?? "Europe/Madrid").slice(0, 64);

  if (!isValidUsername(username)) {
    return { error: "El usuario debe tener de 3 a 20 caracteres: letras, números, punto o guion bajo." };
  }
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!ageConsent) return { error: "Para continuar, marca la casilla de edad o permiso." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: usernameToAuthEmail(username),
    password,
    options: { data: { username, age_consent: true, timezone } },
  });
  if (error) {
    return {
      error: /registered|exists/i.test(error.message)
        ? "Ese nombre de usuario ya está cogido. Prueba con otro."
        : "No hemos podido crear la cuenta. Inténtalo de nuevo.",
    };
  }
  if (!data.session) {
    return { error: "La cuenta se ha creado, pero no se ha podido iniciar sesión. Prueba a entrar." };
  }
  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
