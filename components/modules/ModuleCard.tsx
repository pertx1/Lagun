import type { ReactNode } from "react";

export function ModuleCard({
  emoji,
  title,
  subtitle,
  children,
  id,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
}) {
  const hid = `${id ?? title.replace(/\W+/g, "-").toLowerCase()}-h`;
  return (
    <section aria-labelledby={hid} className="rounded-3xl border border-line bg-surface p-5">
      <h3 id={hid} className="flex items-center gap-2 text-lg font-extrabold">
        <span aria-hidden className="text-2xl">
          {emoji}
        </span>
        {title}
      </h3>
      {subtitle && <p className="mb-3 text-sm text-muted">{subtitle}</p>}
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export interface Tip {
  title: string;
  body: ReactNode;
}

/** Lista de consejos desplegables (accesible con teclado, sin JS). */
export function TipList({ tips }: { tips: Tip[] }) {
  return (
    <div className="flex flex-col gap-2">
      {tips.map((t) => (
        <details key={t.title} className="group rounded-2xl border border-line bg-bg px-4 py-3">
          <summary className="cursor-pointer list-none font-bold marker:hidden">
            <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden>
              ›
            </span>
            {t.title}
          </summary>
          <div className="mt-2 text-[0.97rem] leading-relaxed">{t.body}</div>
        </details>
      ))}
    </div>
  );
}
