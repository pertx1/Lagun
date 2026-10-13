import { ModuleCard, TipList } from "./ModuleCard";
import { GentleChallenge } from "./GentleChallenge";
import { Situations } from "./Situations";
import { VentSpace } from "./VentSpace";

export function SocModule() {
  return (
    <div className="flex flex-col gap-4">
      <ModuleCard emoji="🌱" title="Reto amable" subtitle="Pequeños pasos para conectar, a tu ritmo.">
        <GentleChallenge />
      </ModuleCard>

      <ModuleCard emoji="🎭" title="Situaciones de ejemplo" subtitle="Practica sin presión: no hay respuesta perfecta.">
        <Situations
          items={[
            {
              prompt: "Llegas a un grupo que ya está hablando y no conoces a casi nadie.",
              options: [
                { text: "Me quedo cerca, escucho y comento algo cuando encaje.", good: true, feedback: "¡Muy buena! Escuchar primero te da tiempo a encontrar tu momento." },
                { text: "Me voy: seguro que molesto.", good: false, feedback: "Es normal sentirlo, pero casi nunca molestamos tanto como creemos. Prueba a quedarte un minuto más." },
                { text: "Pregunto “¿de qué habláis?” con una sonrisa.", good: true, feedback: "Directo y amable. A la mayoría de la gente le gusta que se interesen." },
              ],
            },
            {
              prompt: "Alguien no te contesta un mensaje en todo el día.",
              options: [
                { text: "Pienso que estará ocupado/a y sigo con lo mío.", good: true, feedback: "Bien visto. Hay mil razones para no contestar que no tienen que ver contigo." },
                { text: "Seguro que está enfadado/a conmigo.", good: false, feedback: "Tu cabeza busca explicaciones, pero no tienes pruebas. ¿Qué otra explicación podría haber?" },
                { text: "Le mando 5 mensajes más.", good: false, feedback: "Se entiende la ansiedad, pero dar espacio suele ir mejor. Prueba a esperar un poco." },
              ],
            },
            {
              prompt: "Te invitan a un plan y te da ansiedad ir.",
              options: [
                { text: "Voy un rato, con la opción de irme si no estoy bien.", good: true, feedback: "¡Gran estrategia! Tener una salida hace que dar el paso sea más fácil." },
                { text: "Digo que no siempre, por si acaso.", good: false, feedback: "Evitar alivia al momento, pero a la larga la ansiedad crece. Prueba con algo pequeño." },
                { text: "Propongo un plan más tranquilo, a mi medida.", good: true, feedback: "Muy buena idea: adaptar el plan también es cuidarte." },
              ],
            },
          ]}
        />
      </ModuleCard>

      <ModuleCard emoji="🤝" title="Habilidades sociales">
        <TipList
          tips={[
            { title: "Empezar a hablar", body: <p>Usa algo que compartís (“¿has hecho los deberes de mates?”). Las preguntas abiertas (qué, cómo) dan más juego que las de sí/no.</p> },
            { title: "Escuchar de verdad", body: <p>Mira a la persona, repite con tus palabras lo que te ha contado (“o sea, que te agobió…”) y pregunta más. La gente recuerda cómo la hiciste sentir.</p> },
            { title: "Si te sientes solo/a", body: <p>Busca actividades con gente que comparte algo contigo: un club, un deporte, un voluntariado, un servidor de un juego. Es más fácil conectar haciendo algo juntos.</p> },
            { title: "Lo que piensan los demás", body: <p>La mayoría está más pendiente de sí misma de lo que crees. Pregúntate: “¿le daría tanta importancia si le pasara a un/a amigo/a?”.</p> },
          ]}
        />
      </ModuleCard>

      <ModuleCard emoji="🎈" title="Para desahogarte">
        <VentSpace />
      </ModuleCard>
    </div>
  );
}
