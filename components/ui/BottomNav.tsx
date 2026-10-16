"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { AREA_EMOJI } from "@/config/areas";
import { AREAS } from "@/lib/types";

export function BottomNav() {
  const path = usePathname();
  const { t } = useI18n();
  const items = [
    { href: "/home", label: t.nav.home, icon: "🏠" },
    ...AREAS.map((a) => ({ href: `/area/${a}`, label: t.areas[a].short, icon: AREA_EMOJI[a] })),
  ];
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-bold ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span aria-hidden className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>
                  {it.icon}
                </span>
                <span className="max-w-full truncate px-0.5">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
