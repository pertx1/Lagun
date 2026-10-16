import type { CountryResources } from "@/config/safety";
import { TipList } from "./ModuleCard";
import { Affirmations } from "./Affirmations";

/** Para recordarte */
export function AffirmationsTool() {
  return (
    <div className="flex flex-col gap-3">
      <Affirmations />
    </div>
  );
}

/** Autoaceptación */
export function SelfAcceptance() {
  return (
    <div className="flex flex-col gap-3">
      <TipList
        tips={[
          {
            title: "No hay prisa por ponerte etiquetas",
            body: (
              <p>
                Puedes explorar quién eres sin decidir nada hoy. Las etiquetas sirven si te ayudan; si no, no las
                necesitas. Y está bien si cambian con el tiempo.
              </p>
            ),
          },
          {
            title: "Si te cuesta aceptarte",
            body: (
              <p>
                Muchas de las ideas que nos hacen dudar de nosotros/as vienen de fuera. Pregúntate: ¿le diría esto a
                un/a amigo/a que se siente como yo? Háblate con el mismo cariño.
              </p>
            ),
          },
          {
            title: "Miedo al rechazo",
            body: (
              <p>
                No tienes que contárselo a nadie antes de estar preparado/a. Si quieres hacerlo, empieza por alguien que
                sepas que te va a cuidar. Tu seguridad va primero.
              </p>
            ),
          },
          {
            title: "Sentirte solo/a con esto",
            body: (
              <p>
                No eres la única persona que se siente así, aunque ahora lo parezca. Hay grupos de jóvenes LGTBIQ+ donde
                puedes hablar con gente que te entiende, también online.
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}

/** Organizaciones de confianza (solo web). */
export function IdentityOrgs({ resources }: { resources: CountryResources }) {
  return (
    <ul className="flex flex-col gap-2">
      {resources.identity
        .filter((r) => r.url)
        .map((r) => (
          <li key={r.name} className="rounded-2xl bg-bg p-3">
            <p className="font-bold">{r.name}</p>
            <p className="text-sm text-muted">{r.description}</p>
            <div className="mt-1 flex gap-3 text-sm font-bold">
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  Web<span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              )}
            </div>
          </li>
        ))}
    </ul>
  );
}
