"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

/** Aviso visible: Lagun no es un producto médico. */
export function Disclaimer({ className = "" }: { className?: string }) {
  const d = useI18n().t.common.disclaimer;
  return (
    <p className={`text-sm text-muted ${className}`}>
      {d.a} <strong>{d.strong}</strong> {d.b}{" "}
      <Link href="/ayuda" className="font-bold text-accent underline">
        {d.link}
      </Link>
      {d.c}
    </p>
  );
}
