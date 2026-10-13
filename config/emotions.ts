export type EmotionKey =
  | "alegria"
  | "calma"
  | "gratitud"
  | "tristeza"
  | "ansiedad"
  | "enfado"
  | "miedo"
  | "cansancio";

export interface EmotionDef {
  key: EmotionKey;
  label: string;
  color: string;
  emoji: string;
}

/** Cada emoción = un color de bola en la jarra. */
export const EMOTIONS: EmotionDef[] = [
  { key: "alegria", label: "Alegría", color: "#FACC15", emoji: "😊" },
  { key: "calma", label: "Calma", color: "#4ADE80", emoji: "😌" },
  { key: "gratitud", label: "Gratitud", color: "#F472B6", emoji: "🥰" },
  { key: "tristeza", label: "Tristeza", color: "#60A5FA", emoji: "😢" },
  { key: "ansiedad", label: "Ansiedad", color: "#A78BFA", emoji: "😰" },
  { key: "enfado", label: "Enfado", color: "#F87171", emoji: "😠" },
  { key: "miedo", label: "Miedo", color: "#FB923C", emoji: "😨" },
  { key: "cansancio", label: "Cansancio", color: "#94A3B8", emoji: "🥱" },
];

export const EMOTION_BY_KEY = Object.fromEntries(EMOTIONS.map((e) => [e.key, e])) as Record<
  EmotionKey,
  EmotionDef
>;

export const MOOD_LABELS = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"] as const;
export const MOOD_EMOJI = ["😞", "😕", "😐", "🙂", "😄"] as const;
