"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { register, type FormState } from "../actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/client";

export function RegisterForm() {
  const { t } = useI18n();
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
        label={t.auth.usernameLabel}
        hint={t.auth.usernameHint}
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
        label={t.auth.password}
        hint={t.auth.passwordHint}
        minLength={8}
        autoComplete="new-password"
        required
      />

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="age_consent" className="mt-1 size-5 accent-[var(--primary)]" required />
        <span>
          {t.auth.consentA}{" "}
          <Link href="/privacidad" target="_blank" className="font-bold text-accent underline">
            {t.auth.consentLink}
          </Link>{" "}
          {t.auth.consentB}
        </span>
      </label>

      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? t.auth.creating : t.auth.create}
      </Button>
    </form>
  );
}
