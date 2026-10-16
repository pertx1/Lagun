import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { Frog } from "@/components/Frog/Frog";
import { ButtonLink } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const FEATURE_ICONS = ["🫙", "💬", "🧘", "🐸"];

export default async function Landing() {
  const { userId } = await getSession();
  if (userId) redirect("/home");
  const { t } = await getI18n();

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 pb-10 pt-20 text-center">
      <Frog size={180} mood="happy" withCorner state={{ corner: "corner_lily" }} label={t.landing.frogAria} />
      <h1 className="mt-4 text-4xl font-black tracking-tight text-accent">Lagun</h1>
      <p className="mt-4 text-lg">
        {t.landing.tagline}
        <strong> {t.landing.taglineStrong}</strong>
      </p>
      <ul className="mt-6 grid w-full grid-cols-2 gap-3 text-left text-sm">
        {t.landing.features.map((text, i) => (
          <li key={text} className="rounded-2xl bg-surface p-3 font-bold">
            <span aria-hidden>{FEATURE_ICONS[i]}</span> {text}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex w-full flex-col gap-3">
        <ButtonLink href="/register">{t.landing.start}</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          {t.landing.haveAccount}
        </ButtonLink>
      </div>
      <LanguageSwitcher className="mt-6" />
      <p className="mt-6 text-sm">
        <Link href="/familias" className="font-bold text-accent underline">
          {t.landing.families}
        </Link>
        {" · "}
        <Link href="/privacidad" className="font-bold text-accent underline">
          {t.landing.privacy}
        </Link>
      </p>
      <Disclaimer className="mt-6" />
    </main>
  );
}
