import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getResources, SUPPORTED_COUNTRIES } from "@/config/safety";
import { HelpResources } from "@/components/ui/HelpResources";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Frog } from "@/components/Frog/Frog";

export const metadata: Metadata = { title: "Ayuda" };

export default async function AyudaPage({ searchParams }: PageProps<"/ayuda">) {
  const sp = await searchParams;
  const { profile } = await getSession();
  const country = typeof sp.pais === "string" ? sp.pais : profile?.country;
  const resources = getResources(country);

  return (
    <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-16">
      <div className="mb-4 flex items-center gap-3">
        <Frog size={72} mood="calm" label="" />
        <div>
          <h1 className="text-2xl font-black">No estás solo/a</h1>
          <p className="text-muted">Pedir ayuda es un acto de valentía. Aquí hay personas que te escuchan.</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-surface p-4 text-sm">
        <p className="font-bold">Un momento para respirar 🫧</p>
        <p>
          Inspira despacio contando 4… aguanta 4… suelta en 6. Repite unas veces. Lo que sientes ahora es muy intenso,
          pero puede cambiar. No tienes que resolverlo todo ahora: solo dar el siguiente paso.
        </p>
      </div>

      <HelpResources resources={resources} showIdentity />

      <nav aria-label="Elegir país" className="mt-6 text-sm">
        <span className="text-muted">Recursos de: </span>
        {SUPPORTED_COUNTRIES.map((c, i) => (
          <span key={c.code}>
            {i > 0 && " · "}
            <Link href={`/ayuda?pais=${c.code}`} className="font-bold text-accent underline" aria-current={c.code === resources.code ? "true" : undefined}>
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-3">
        <Link href={profile ? "/home" : "/"} className="font-bold text-accent underline">
          ← Volver
        </Link>
        <Disclaimer />
      </div>
    </main>
  );
}
