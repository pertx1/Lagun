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
  color: string;
  emoji: string;
}

/** Cada emoción = un color de bola en la jarra. El nombre está en los diccionarios (t.emotions). */
export const EMOTIONS: EmotionDef[] = [
  { key: "alegria", color: "#FACC15", emoji: "😊" },
  { key: "calma", color: "#4ADE80", emoji: "😌" },
  { key: "gratitud", color: "#F472B6", emoji: "🥰" },
  { key: "tristeza", color: "#60A5FA", emoji: "😢" },
  { key: "ansiedad", color: "#A78BFA", emoji: "😰" },
  { key: "enfado", color: "#F87171", emoji: "😠" },
  { key: "miedo", color: "#FB923C", emoji: "😨" },
  { key: "cansancio", color: "#94A3B8", emoji: "🥱" },
];

export const EMOTION_BY_KEY = Object.fromEntries(EMOTIONS.map((e) => [e.key, e])) as Record<EmotionKey, EmotionDef>;

export const MOOD_EMOJI = ["😞", "😕", "😐", "🙂", "😄"] as const;
