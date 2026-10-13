"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { register, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ageFrom, DIGITAL_CONSENT_AGE, MIN_AGE } from "@/lib/age";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  const [birth, setBirth] = useState("");
  const age = birth ? ageFrom(birth) : null;
  const needsGuardian = age !== null && age >= MIN_AGE && age < DIGITAL_CONSENT_AGE;
  const tooYoung = age !== null && age < MIN_AGE;
  const tzRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tzRef.current) tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  if (state.info) return <FormMessage info={state.info} />;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input ref={tzRef} type="hidden" name="timezone" defaultValue="Europe/Madrid" />
      <Field
        id="display_name"
        name="display_name"
        label="¿Cómo quieres que te llamemos?"
        hint="Puede ser un apodo. No hace falta tu nombre real."
        maxLength={40}
        autoComplete="nickname"
        required
      />
      <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
      <Field
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        hint="Mínimo 8 caracteres."
        minLength={8}
        autoComplete="new-password"
        required
      />
      <Field
        id="birth_date"
        name="birth_date"
        type="date"
        label="Fecha de nacimiento"
        hint="Solo la usamos para saber tu edad y cuidar de ti como corresponde."
        value={birth}
        onChange={(e) => setBirth(e.target.value)}
        required
      />

      {tooYoung && (
        <p role="alert" className="rounded-2xl bg-warm p-3 text-sm">
          Lagun es para personas a partir de {MIN_AGE} años. Si necesitas hablar con alguien ahora, en{" "}
          <Link href="/ayuda" className="font-bold text-accent underline">Ayuda</Link> tienes teléfonos gratuitos para ti,
          como la Fundación ANAR (900 20 20 10).
        </p>
      )}

      {needsGuardian && (
        <div className="rounded-2xl border-2 border-line bg-surface p-4">
          <p className="mb-2 text-sm">
            Como tienes menos de {DIGITAL_CONSENT_AGE} años, la ley pide que tu madre, padre o tutor/a lea la{" "}
            <Link href="/familias" target="_blank" className="font-bold text-accent underline">
              información para familias
            </Link>{" "}
            y te dé permiso.
          </p>
          <label className="flex items-start gap-3 text-sm font-semibold">
            <input type="checkbox" name="guardian_consent" className="mt-1 size-5 accent-[var(--primary)]" required />
            Mi madre, padre o tutor/a ha leído la información y da su consentimiento.
          </label>
        </div>
      )}

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="privacy" className="mt-1 size-5 accent-[var(--primary)]" required />
        <span>
          He leído la{" "}
          <Link href="/privacidad" target="_blank" className="font-bold text-accent underline">
            política de privacidad
          </Link>{" "}
          y entiendo que Lagun es una app de apoyo, no un servicio médico.
        </span>
      </label>

      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending || tooYoung}>
        {pending ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
