"use client";

import { useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/client";
import { PointsToast } from "./PointsToast";

const EMOJI = ["👀", "✋", "👂", "👃", "👅"];

/** Grounding 5-4-3-2-1: para volver al presente cuando la cabeza va a mil. */
export function Grounding() {
  const { t } = useI18n();
  const [step, setStep] = useState(-1);
  const [points, setPoints] = useState<number | null>(null);
  const steps = t.grounding.steps;

  if (step === -1)
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm">{t.grounding.intro}</p>
        <Button
          variant="secondary"
          onClick={() => {
            setStep(0);
            setPoints(null);
          }}
        >
          {t.grounding.start}
        </Button>
        <PointsToast points={points} text={t.grounding.done} />
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-3 text-center" aria-live="polite">
      <p className="text-5xl" aria-hidden>
        {EMOJI[step]}
      </p>
      <p className="text-xl font-extrabold">{steps[step]}</p>
      <p className="text-sm text-muted">{t.grounding.hint}</p>
      <Button
        onClick={() => {
          if (step < steps.length - 1) setStep(step + 1);
          else {
            setStep(-1);
            awardActivity("grounding").then(setPoints);
          }
        }}
      >
        {step < steps.length - 1 ? t.grounding.next : t.grounding.finish}
      </Button>
    </div>
  );
}
