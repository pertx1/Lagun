import { addExam } from "@/app/actions";
import { daysUntil } from "@/lib/dates";
import type { Exam } from "@/lib/types";
import { inputClass } from "@/components/ui/Field";
import { TipList } from "./ModuleCard";
import { Pomodoro } from "./Pomodoro";
import { ExamDeleteButton } from "./ExamDeleteButton";

function whenLabel(days: number) {
  if (days < 0) return "ya pasó";
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

/** Exámenes y entregas */
export function ExamCalendar({ exams, today }: { exams: Exam[]; today: string }) {
  const upcoming = exams.filter((e) => daysUntil(e.due_date, today) >= 0);
  return (
    <div className="flex flex-col gap-3">
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted">No tienes nada apuntado. Añade lo que tengas cerca.</p>
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
                  {new Date(e.due_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{e.title}</p>
                  <p className="text-sm text-muted">
                    {e.subject} · {whenLabel(d)}
                  </p>
                </div>
                <ExamDeleteButton id={e.id} label={e.title} />
              </li>
            );
          })}
        </ul>
      )}
      {upcoming.some((e) => daysUntil(e.due_date, today) <= 2) && (
        <p className="rounded-2xl bg-warm p-3 text-sm">
          Tienes algo muy cerca. Respira: trocea lo que queda en pasos pequeños y empieza por uno. Lo que no dé tiempo,
          no te define. 💚
        </p>
      )}
      <details className="rounded-2xl border border-line bg-bg p-3">
        <summary className="cursor-pointer font-bold text-accent">+ Añadir examen o entrega</summary>
        <form action={addExam} className="mt-3 grid gap-2">
          <label className="text-sm font-bold" htmlFor="ex-subject">
            Asignatura
          </label>
          <input id="ex-subject" name="subject" required maxLength={60} className={inputClass} />
          <label className="text-sm font-bold" htmlFor="ex-title">
            ¿Qué es?
          </label>
          <input
            id="ex-title"
            name="title"
            required
            maxLength={120}
            placeholder="Examen tema 3, trabajo…"
            className={inputClass}
          />
          <label className="text-sm font-bold" htmlFor="ex-date">
            Fecha
          </label>
          <input id="ex-date" name="due_date" type="date" required min={today} className={inputClass} />
          <button className="mt-1 min-h-11 rounded-2xl bg-primary font-bold text-on-primary">Guardar</button>
        </form>
      </details>
    </div>
  );
}

/** Pomodoro */
export function PomodoroTool() {
  return (
    <div className="flex flex-col gap-3">
      <Pomodoro />
    </div>
  );
}

/** Métodos de estudio */
export function StudyMethods() {
  return (
    <div className="flex flex-col gap-3">
      <TipList
        tips={[
          {
            title: "Repaso espaciado",
            body: (
              <p>
                Repasa hoy, otra vez en 1-2 días, luego a la semana. Cada repaso es más corto. Funciona mucho mejor que
                estudiarlo todo la noche anterior, y se olvida menos.
              </p>
            ),
          },
          {
            title: "Recuerdo activo",
            body: (
              <p>
                En vez de releer, cierra el libro e intenta explicarlo con tus palabras (o hazte preguntas tipo test).
                Lo que te cuesta recordar es justo lo que hay que repasar.
              </p>
            ),
          },
          {
            title: "Concentración",
            body: (
              <ul className="ml-5 list-disc">
                <li>Móvil en otra habitación o en modo no molestar.</li>
                <li>Una sola tarea cada vez.</li>
                <li>Agua cerca y descansos de verdad (moverte, no scroll).</li>
              </ul>
            ),
          },
          {
            title: "Gestión del tiempo",
            body: (
              <p>
                Apunta todo lo pendiente y elige solo 3 cosas para hoy. Empieza por la más pequeña para coger ritmo. Si
                algo no da tiempo, se mueve a mañana: no es un fracaso, es planificar.
              </p>
            ),
          },
          {
            title: "Cuando te comparas",
            body: (
              <p>
                Cada persona tiene su ritmo y sus circunstancias. Compárate solo con tu yo de la semana pasada: ¿qué has
                aprendido desde entonces? Eso es avanzar.
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}
