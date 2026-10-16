"use client";

import { addExam } from "@/app/actions";
import { daysUntil } from "@/lib/dates";
import type { Exam } from "@/lib/types";
import { useI18n } from "@/lib/i18n/client";
import { inputClass } from "@/components/ui/Field";
import { TipList } from "./ModuleCard";
import { Pomodoro } from "./Pomodoro";
import { ExamDeleteButton } from "./ExamDeleteButton";

/** Exámenes y entregas */
export function ExamCalendar({ exams, today }: { exams: Exam[]; today: string }) {
  const { t, f, dateLocale } = useI18n();
  const a = t.acad;
  const whenLabel = (days: number) =>
    days < 0 ? a.when.past : days === 0 ? a.when.today : days === 1 ? a.when.tomorrow : f(a.when.inDays, { n: days });
  const upcoming = exams.filter((e) => daysUntil(e.due_date, today) >= 0);

  return (
    <div className="flex flex-col gap-3">
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted">{a.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.map((e) => {
            const d = daysUntil(e.due_date, today);
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-bg p-3">
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl text-center text-xs font-black ${
                    d <= 2 ? "bg-warm" : "bg-surface-2"
                  }`}
                >
                  {new Date(e.due_date + "T12:00:00").toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{e.title}</p>
                  <p className="text-sm text-muted">
                    {e.subject} · {whenLabel(d)}
                  </p>
                </div>
                <ExamDeleteButton id={e.id} label={f(a.deleteAria, { title: e.title })} />
              </li>
            );
          })}
        </ul>
      )}
      {upcoming.some((e) => daysUntil(e.due_date, today) <= 2) && <p className="rounded-2xl bg-warm p-3 text-sm">{a.soon}</p>}
      <details className="rounded-2xl border border-line bg-bg p-3">
        <summary className="cursor-pointer font-bold text-accent">{a.add}</summary>
        <form action={addExam} className="mt-3 grid gap-2">
          <label className="text-sm font-bold" htmlFor="ex-subject">
            {a.subject}
          </label>
          <input id="ex-subject" name="subject" required maxLength={60} className={inputClass} />
          <label className="text-sm font-bold" htmlFor="ex-title">
            {a.what}
          </label>
          <input id="ex-title" name="title" required maxLength={120} placeholder={a.whatPlaceholder} className={inputClass} />
          <label className="text-sm font-bold" htmlFor="ex-date">
            {a.date}
          </label>
          <input id="ex-date" name="due_date" type="date" required min={today} className={inputClass} />
          <button className="mt-1 min-h-11 rounded-2xl bg-primary font-bold text-on-primary">{t.common.save}</button>
        </form>
      </details>
    </div>
  );
}

/** Pomodoro */
export function PomodoroTool() {
  return <Pomodoro />;
}

/** Métodos de estudio */
export function StudyMethods() {
  return <TipList tips={useI18n().t.acad.methods} />;
}
