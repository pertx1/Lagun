"use client";

import { useState } from "react";
import { awardActivity } from "@/app/actions";
import { inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PointsToast } from "./PointsToast";
import { useI18n } from "@/lib/i18n/client";

/** Ayuda a construir un "mensaje yo" para hablar en casa sin atacar. No se guarda. */
export function IMessageBuilder() {
  const { t, f } = useI18n();
  const m = t.fam;
  const [feel, setFeel] = useState("");
  const [when, setWhen] = useState("");
  const [need, setNeed] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const ready = feel.trim() && when.trim();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="im-feel" className="text-sm font-bold">{m.feel}</label>
      <input id="im-feel" value={feel} onChange={(e) => setFeel(e.target.value)} placeholder={m.feelPh} className={inputClass} />
      <label htmlFor="im-when" className="text-sm font-bold">{m.when}</label>
      <input id="im-when" value={when} onChange={(e) => setWhen(e.target.value)} placeholder={m.whenPh} className={inputClass} />
      <label htmlFor="im-need" className="text-sm font-bold">{m.need}</label>
      <input id="im-need" value={need} onChange={(e) => setNeed(e.target.value)} placeholder={m.needPh} className={inputClass} />
      {ready && (
        <div className="mt-2 rounded-2xl bg-bg p-4" aria-live="polite">
          <p className="text-sm text-muted">{m.yourMessage}</p>
          <p className="text-lg font-bold">
            {f(m.message, {
              feel: feel.trim(),
              when: when.trim(),
              need: need.trim() ? f(m.needPart, { need: need.trim() }) : "",
            })}
          </p>
          <Button variant="secondary" className="mt-3" onClick={() => awardActivity("module").then(setPoints)}>
            {m.keep}
          </Button>
        </div>
      )}
      <PointsToast points={points} text={m.done} />
      <p className="text-xs text-muted">{m.notSaved}</p>
    </div>
  );
}
