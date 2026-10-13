"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home", label: "Inicio", icon: "🏠" },
  { href: "/jarra", label: "Jarra", icon: "🫙" },
  { href: "/chat", label: "Hablar", icon: "💬" },
  { href: "/feed", label: "Feed", icon: "🌱" },
  { href: "/stats", label: "Progreso", icon: "📈" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ITEMS.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-bold ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span aria-hidden className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>
                  {it.icon}
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
