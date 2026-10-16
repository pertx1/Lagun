import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { getResources, supportedCountries } from "@/config/safety";
import { HelpResources } from "@/components/ui/HelpResources";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Frog } from "@/components/Frog/Frog";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.help };
}

export default async function AyudaPage({ searchParams }: PageProps<"/ayuda">) {
  const sp = await searchParams;
  const { profile } = await getSession();
  const { t, locale } = await getI18n();
  const country = typeof sp.pais === "string" ? sp.pais : profile?.country;
  const resources = getResources(country);

  return (
    <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-16">
      <div className="mb-4 flex items-center gap-3">
        <Frog size={72} mood="calm" label="" />
        <div>
          <h1 className="text-2xl font-black">{t.help.pageTitle}</h1>
          <p className="text-muted">{t.help.pageSubtitle}</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-surface p-4 text-sm">
        <p className="font-bold">{t.help.breatheTitle}</p>
        <p>{t.help.breatheBody}</p>
      </div>

      <HelpResources resources={resources} showIdentity />

      <nav aria-label={t.help.countryNav} className="mt-6 text-sm">
        <span className="text-muted">{t.help.resourcesOf}</span>
        {supportedCountries(locale).map((c, i) => (
          <span key={c.code}>
            {i > 0 && " · "}
            <Link
              href={`/ayuda?pais=${c.code}`}
              className="font-bold text-accent underline"
              aria-current={c.code === resources.code ? "true" : undefined}
            >
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-3">
        <Link href={profile ? "/home" : "/"} className="font-bold text-accent underline">
          {t.help.back}
        </Link>
        <Disclaimer />
      </div>
    </main>
  );
}
