"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";

export function Affirmations() {
  const { t } = useI18n();
  const list = t.iden.affirmations;
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="w-full rounded-2xl bg-bg p-5 text-center text-xl font-extrabold" aria-live="polite">
        {list[i % list.length]}
      </p>
      <button type="button" onClick={() => setI((i + 1) % list.length)} className="font-bold text-accent underline">
        {t.iden.another}
      </button>
    </div>
  );
}
