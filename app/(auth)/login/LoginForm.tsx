"use client";

import { useActionState } from "react";
import { login, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/client";

export function LoginForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        id="username"
        name="username"
        label={t.auth.username}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
      />
      <Field id="password" name="password" type="password" label={t.auth.password} autoComplete="current-password" required />
      <FormMessage {...state} />
      <Button type="submit" disabled={pending}>
        {pending ? t.auth.loggingIn : t.auth.login}
      </Button>
    </form>
  );
}
