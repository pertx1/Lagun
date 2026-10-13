"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ageFrom, DIGITAL_CONSENT_AGE, MIN_AGE } from "@/lib/age";

export interface FormState {
  error?: string;
  info?: string;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu email y tu contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "No hemos podido entrar. Revisa el email y la contraseña." };
  redirect("/home");
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const displayName = String(form.get("display_name") ?? "").trim().slice(0, 40);
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const birthDate = String(form.get("birth_date") ?? "");
  const guardianConsent = form.get("guardian_consent") === "on";
  const privacy = form.get("privacy") === "on";
  const timezone = String(form.get("timezone") ?? "Europe/Madrid").slice(0, 64);

  if (!displayName) return { error: "Dinos cómo quieres que te llamemos (puede ser un apodo)." };
  if (!email) return { error: "Necesitamos un email para tu cuenta." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const age = ageFrom(birthDate);
  if (age === null || age > 120) return { error: "Revisa la fecha de nacimiento." };
  if (age < MIN_AGE) {
    return { error: `Lagun es para personas a partir de ${MIN_AGE} años. Si necesitas hablar con alguien, en la pantalla de Ayuda tienes teléfonos para ti.` };
  }
  if (age < DIGITAL_CONSENT_AGE && !guardianConsent) {
    return { error: "Como tienes menos de 14 años, tu madre, padre o tutor/a tiene que leer la información para familias y dar su consentimiento." };
  }
  if (!privacy) return { error: "Para continuar, acepta la política de privacidad." };

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
      data: {
        display_name: displayName,
        birth_date: birthDate,
        guardian_consent: guardianConsent,
        timezone,
      },
    },
  });
  if (error) return { error: "No hemos podido crear la cuenta. Puede que ese email ya esté registrado." };
  if (!data.session) {
    return { info: "¡Casi! Te hemos enviado un email para confirmar tu cuenta. Ábrelo y volverás aquí." };
  }
  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
