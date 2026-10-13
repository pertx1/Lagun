import { ModuleCard, TipList } from "./ModuleCard";
import { IMessageBuilder } from "./IMessageBuilder";
import type { CountryResources } from "@/config/safety";

export function FamModule({ resources }: { resources: CountryResources }) {
  const youth = resources.crisis.find((r) => r.youth);
  return (
    <div className="flex flex-col gap-4">
      <ModuleCard emoji="💬" title="Comunicación en casa" subtitle="Hablar desde lo que sientes, no desde el reproche.">
        <IMessageBuilder />
      </ModuleCard>

      <ModuleCard emoji="🧱" title="Límites sanos y conflictos">
        <TipList
          tips={[
            {
              title: "Poner un límite con cariño",
              body: <p>Sé claro/a y breve: “Necesito que llames antes de entrar en mi cuarto”. No hace falta justificarlo mil veces. Un límite protege la relación, no la rompe.</p>,
            },
            {
              title: "Cuando una discusión sube de tono",
              body: (
                <ol className="ml-5 list-decimal">
                  <li>Para: “Ahora estoy muy nervioso/a, ¿lo hablamos en un rato?”.</li>
                  <li>Respira o sal a dar una vuelta corta.</li>
                  <li>Vuelve cuando estéis más tranquilos/as.</li>
                  <li>Habla de una sola cosa cada vez.</li>
                </ol>
              ),
            },
            {
              title: "Elegir el momento",
              body: <p>Las conversaciones importantes funcionan mejor sin prisas ni pantallas delante. Puedes avisar: “¿Tienes un rato luego? Quiero contarte algo”.</p>,
            },
            {
              title: "Si en casa hay mucha tensión",
              body: <p>No eres responsable de arreglar los problemas de los adultos. Busca tu refugio (música, deporte, un sitio tranquilo) y una persona adulta de confianza fuera de casa: un/a profe, orientador/a, familiar.</p>,
            },
          ]}
        />
      </ModuleCard>

      <ModuleCard emoji="📞" title="Recursos">
        <p className="text-sm">
          Si en casa pasa algo que te hace daño o te da miedo, no es culpa tuya y mereces ayuda.
          {youth && (
            <>
              {" "}
              <strong>{youth.name}</strong>: {youth.description}{" "}
              {youth.phone && (
                <a href={`tel:${youth.phone}`} className="font-bold text-accent underline">
                  Llamar
                </a>
              )}
            </>
          )}
        </p>
        <p className="text-sm">
          También puedes hablar con el/la orientador/a de tu centro. Y si estás en peligro, llama al {resources.emergency.phone}.
        </p>
      </ModuleCard>
    </div>
  );
}
