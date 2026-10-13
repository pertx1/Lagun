export interface FrogPalette {
  body: string;
  shade: string;
  belly: string;
  line: string;
}

export const FROG_COLORS: Record<string, FrogPalette> = {
  color_verde: { body: "#4ADE80", shade: "#22C55E", belly: "#DCFCE7", line: "#14532D" },
  color_turquesa: { body: "#2DD4BF", shade: "#14B8A6", belly: "#CCFBF1", line: "#134E4A" },
  color_lima: { body: "#A3E635", shade: "#84CC16", belly: "#ECFCCB", line: "#365314" },
  color_rosa: { body: "#F9A8D4", shade: "#F472B6", belly: "#FCE7F3", line: "#831843" },
  color_lila: { body: "#C4B5FD", shade: "#A78BFA", belly: "#EDE9FE", line: "#4C1D95" },
  color_dorado: { body: "#FCD34D", shade: "#F59E0B", belly: "#FEF3C7", line: "#78350F" },
};

export type FrogMood = "happy" | "calm" | "sad" | "worried" | "sleepy" | "excited";

/** Estado de ánimo de Igel a partir de un ánimo 0-4. */
export function moodFromScore(score: number | null | undefined): FrogMood {
  if (score === null || score === undefined) return "calm";
  if (score <= 0) return "sad";
  if (score === 1) return "worried";
  if (score === 2) return "calm";
  if (score === 3) return "happy";
  return "excited";
}
