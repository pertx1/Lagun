"use client";

import { useActionState } from "react";
import { login, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        id="username"
        name="username"
        label="Usuario"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
      />
      <Field id="password" name="password" type="password" label="Contraseña" autoComplete="current-password" required />
      <FormMessage {...state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
