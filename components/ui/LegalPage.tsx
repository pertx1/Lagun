import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

interface Section {
  h: string;
  p?: string;
  list?: string[];
}

export async function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  const { t } = await getI18n();
  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-16">
      <Link href="/" className="font-bold text-accent underline">
        {t.legal.back}
      </Link>
      <h1 className="mb-2 mt-4 text-3xl font-black">{title}</h1>
      <p className="mb-6 rounded-2xl bg-warm p-3 text-sm">{t.legal.draft}</p>
      <div className="flex flex-col gap-4">
        <p>{intro}</p>
        {sections.map((s) => (
          <section key={s.h} className="flex flex-col gap-2">
            <h2 className="mt-4 text-xl font-extrabold">{s.h}</h2>
            {s.p && <p>{s.p}</p>}
            {s.list && (
              <ul className="ml-5 list-disc">
                {s.list.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
