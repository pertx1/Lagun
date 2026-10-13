import type { CountryResources } from "@/config/safety";
import { ModuleCard, TipList } from "./ModuleCard";
import { Affirmations } from "./Affirmations";

/** Apoyo emocional sobre identidad: apropiado para la edad y NADA explícito. */
export function IdenModule({ resources }: { resources: CountryResources }) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleCard emoji="🌈" title="Para recordarte" subtitle="Eres válido/a. Siempre.">
        <Affirmations />
      </ModuleCard>

      <ModuleCard emoji="🪞" title="Autoaceptación">
        <TipList
          tips={[
            {
              title: "No hay prisa por ponerte etiquetas",
              body: <p>Puedes explorar quién eres sin decidir nada hoy. Las etiquetas sirven si te ayudan; si no, no las necesitas. Y está bien si cambian con el tiempo.</p>,
            },
            {
              title: "Si te cuesta aceptarte",
              body: <p>Muchas de las ideas que nos hacen dudar de nosotros/as vienen de fuera. Pregúntate: ¿le diría esto a un/a amigo/a que se siente como yo? Háblate con el mismo cariño.</p>,
            },
            {
              title: "Miedo al rechazo",
              body: <p>No tienes que contárselo a nadie antes de estar preparado/a. Si quieres hacerlo, empieza por alguien que sepas que te va a cuidar. Tu seguridad va primero.</p>,
            },
            {
              title: "Sentirte solo/a con esto",
              body: <p>No eres la única persona que se siente así, aunque ahora lo parezca. Hay grupos de jóvenes LGTBIQ+ donde puedes hablar con gente que te entiende, también online.</p>,
            },
          ]}
        />
      </ModuleCard>

      {resources.identity.length > 0 && (
        <ModuleCard emoji="🫂" title="Organizaciones de confianza" subtitle="Personas que entienden lo que vives.">
          <ul className="flex flex-col gap-2">
            {resources.identity.map((r) => (
              <li key={r.name} className="rounded-2xl bg-bg p-3">
                <p className="font-bold">{r.name}</p>
                <p className="text-sm text-muted">{r.description}</p>
                <div className="mt-1 flex gap-3 text-sm font-bold">
                  {r.phone && <a href={`tel:${r.phone}`} className="text-accent underline">Llamar al {r.phone}</a>}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                      Web<span className="sr-only"> (se abre en otra pestaña)</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </ModuleCard>
      )}
    </div>
  );
}
