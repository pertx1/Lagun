"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { register, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  const tzRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tzRef.current) tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input ref={tzRef} type="hidden" name="timezone" defaultValue="Europe/Madrid" />
      <Field
        id="username"
        name="username"
        label="Nombre de usuario"
        hint="De 3 a 20 caracteres: letras, números, punto o guion bajo. No uses tu nombre real si no quieres."
        minLength={3}
        maxLength={20}
        pattern="[A-Za-z0-9_.]{3,20}"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        hint="Mínimo 8 caracteres. Apúntala bien: sin email no se puede recuperar."
        minLength={8}
        autoComplete="new-password"
        required
      />

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="age_consent" className="mt-1 size-5 accent-[var(--primary)]" required />
        <span>
          Tengo 14 años o más, o mi madre, padre o tutor/a me da permiso. He leído la{" "}
          <Link href="/privacidad" target="_blank" className="font-bold text-accent underline">
            política de privacidad
          </Link>{" "}
          y entiendo que Lagun es una app de apoyo, no un servicio médico.
        </span>
      </label>

      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
