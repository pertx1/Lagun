import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-16">
      <Link href="/" className="font-bold text-accent underline">
        ← Lagun
      </Link>
      <h1 className="mb-2 mt-4 text-3xl font-black">{title}</h1>
      <p className="mb-6 rounded-2xl bg-warm p-3 text-sm">
        Borrador: este texto debe revisarlo un/a profesional jurídico antes de publicar la app.
      </p>
      <div className="flex flex-col gap-4 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </main>
  );
}
