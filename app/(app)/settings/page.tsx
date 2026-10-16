import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { requireProfile } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { deleteAccount } from "@/app/actions";
import { supportedCountries } from "@/config/safety";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SettingsForm } from "./SettingsForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.settings };
}

/** Patrón case-insensitive para la palabra de confirmación (p. ej. "BORRAR"). */
function ciPattern(word: string) {
  return [...word].map((c) => (c.toLowerCase() !== c.toUpperCase() ? `[${c.toUpperCase()}${c.toLowerCase()}]` : c)).join("");
}

export default async function SettingsPage() {
  const { profile } = await requireProfile();
  const { t, locale } = await getI18n();
  const s = t.settings;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-black">{s.title}</h1>

      <SettingsForm
        profile={profile}
        countries={supportedCountries(locale)}
        vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
      />

      <Card>
        <CardTitle>{s.reviewTitle}</CardTitle>
        <p className="my-2 text-sm text-muted">{s.reviewText}</p>
        <Link href="/onboarding" className={buttonClass("secondary")}>
          {s.reviewButton}
        </Link>
      </Card>

      <Card>
        <CardTitle>{s.dataTitle}</CardTitle>
        <p className="my-2 text-sm text-muted">
          {s.dataTextA}{" "}
          <Link href="/privacidad" className="font-bold text-accent underline">
            {s.dataLink}
          </Link>
          .
        </p>
        <a href="/api/account/export" className={buttonClass("secondary")} download>
          {s.download}
        </a>
        <details className="mt-4 rounded-2xl border-2 border-danger p-3">
          <summary className="cursor-pointer font-bold text-danger">{s.deleteTitle}</summary>
          <form action={deleteAccount} className="mt-3 flex flex-col gap-2">
            <p className="text-sm">{s.deleteText}</p>
            <label htmlFor="confirm" className="text-sm font-bold">
              {fmt(s.deleteConfirm, { word: s.deleteWord })}
            </label>
            <input id="confirm" name="confirm" required pattern={ciPattern(s.deleteWord)} className={inputClass} autoComplete="off" />
            <Button variant="danger" type="submit">
              {s.deleteButton}
            </Button>
          </form>
        </details>
      </Card>

      <form action={logout}>
        <Button variant="secondary" type="submit" className="w-full">
          {s.logout}
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link href="/familias" className="font-bold text-accent underline">
          {s.families}
        </Link>{" "}
        ·{" "}
        <Link href="/privacidad" className="font-bold text-accent underline">
          {s.privacy}
        </Link>{" "}
        ·{" "}
        <Link href="/ayuda" className="font-bold text-accent underline">
          {s.help}
        </Link>
      </p>
      <Disclaimer className="text-center" />
    </div>
  );
}
