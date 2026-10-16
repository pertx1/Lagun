import type { Area } from "./types";

export type ItemGroup = Area | "general" | "safety";

export interface QuestionItem {
  id: string;
  group: ItemGroup;
  /** Escala de respuesta: frecuencia (por defecto) o ánimo. El texto está en t.questionnaire. */
  scale?: "frequency" | "mood";
}

/**
 * Ítems del cuestionario. El orden alterna áreas para que no se sienta como
 * un test por bloques. C1 (cribado de seguridad) va al final y se evalúa aparte.
 * Los enunciados están en los diccionarios: t.questionnaire.items[id].
 */
export const QUESTIONS: QuestionItem[] = [
  { id: "G1", group: "general", scale: "mood" },
  { id: "A1", group: "acad" },
  { id: "S1", group: "soc" },
  { id: "F1", group: "fam" },
  { id: "I1", group: "iden" },
  { id: "A2", group: "acad" },
  { id: "S2", group: "soc" },
  { id: "F2", group: "fam" },
  { id: "I2", group: "iden" },
  { id: "A3", group: "acad" },
  { id: "S3", group: "soc" },
  { id: "F3", group: "fam" },
  { id: "I3", group: "iden" },
  { id: "A4", group: "acad" },
  { id: "S4", group: "soc" },
  { id: "F4", group: "fam" },
  { id: "G2", group: "general" },
  { id: "C1", group: "safety" },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);
