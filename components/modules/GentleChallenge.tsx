"use client";

import { useState } from "react";
import { awardActivity } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/client";
import { PointsToast } from "./PointsToast";

export function GentleChallenge() {
  const { t } = useI18n();
  const list = t.soc.challenges;
  const [i, setI] = useState(() => new Date().getDate() % list.length);
  const [points, setPoints] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-2xl bg-bg p-4 text-lg font-bold">“{list[i % list.length]}”</p>
      <p className="text-sm text-muted">{t.soc.challengeHint}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => awardActivity("challenge").then(setPoints)}>{t.soc.tried}</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setI((i + 1) % list.length);
            setPoints(null);
          }}
        >
          {t.soc.another}
        </Button>
      </div>
      <PointsToast points={points} text={t.soc.challengeDone} />
    </div>
  );
}
