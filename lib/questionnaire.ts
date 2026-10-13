import type { Area } from "./types";

export type ItemGroup = Area | "general" | "safety";

export interface QuestionItem {
  id: string;
  group: ItemGroup;
  text: string;
  /** Etiquetas de la escala 0-4. Por defecto, frecuencia. */
  labels?: readonly string[];
}

export const FREQUENCY_LABELS = ["Nunca", "Rara vez", "A veces", "A menudo", "Casi siempre"] as const;
export const MOOD_SCALE_LABELS = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"] as const;

/**
 * Ítems del cuestionario. El orden alterna áreas para que no se sienta como
 * un test por bloques. C1 (cribado de seguridad) va al final y se evalúa aparte.
 */
export const QUESTIONS: QuestionItem[] = [
  { id: "G1", group: "general", text: "¿Cómo describirías tu ánimo esta última semana?", labels: MOOD_SCALE_LABELS },
  { id: "A1", group: "acad", text: "Últimamente me agobia pensar en los estudios o los exámenes." },
  { id: "S1", group: "soc", text: "Me cuesta hacer amigos o hablar con gente nueva." },
  { id: "F1", group: "fam", text: "En casa hay tensión o discusiones a menudo." },
  { id: "I1", group: "iden", text: "A veces me cuesta aceptar o entender quién soy." },
  { id: "A2", group: "acad", text: "Me cuesta concentrarme u organizarme con las tareas." },
  { id: "S2", group: "soc", text: "Me siento solo/a aunque esté rodeado/a de gente." },
  { id: "F2", group: "fam", text: "Siento que mi familia no me entiende." },
  { id: "I2", group: "iden", text: "Me preocupa cómo me van a aceptar por cómo soy o a quién quiero." },
  { id: "A3", group: "acad", text: "Siento que no llego a todo lo que tengo que hacer." },
  { id: "S3", group: "soc", text: "Me preocupa mucho lo que los demás piensan de mí." },
  { id: "F3", group: "fam", text: "Me cuesta hablar de cómo me siento con mi familia." },
  { id: "I3", group: "iden", text: "Me siento solo/a con cosas de mi identidad que no puedo hablar con nadie." },
  { id: "A4", group: "acad", text: "Me comparo con otros y siento que no doy la talla estudiando." },
  { id: "S4", group: "soc", text: "Evito situaciones sociales porque me dan ansiedad." },
  { id: "F4", group: "fam", text: "Las cosas de casa me afectan a mi estado de ánimo." },
  { id: "G2", group: "general", text: "¿Sientes que tienes a alguien con quien hablar cuando lo necesitas?" },
  {
    id: "C1",
    group: "safety",
    text: "Últimamente he tenido pensamientos de hacerme daño o de que no vale la pena seguir.",
  },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);
