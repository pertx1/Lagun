import type { Area } from "@/lib/types";

export const AREA_INFO: Record<Area, { label: string; short: string; emoji: string; blurb: string }> = {
  acad: {
    label: "Estudios",
    short: "Estudios",
    emoji: "📚",
    blurb: "Organizarte, concentrarte y bajar el agobio de los exámenes.",
  },
  soc: {
    label: "Amistades y gente",
    short: "Social",
    emoji: "🫶",
    blurb: "Conectar con otras personas a tu ritmo y sentirte menos solo/a.",
  },
  fam: {
    label: "Familia y casa",
    short: "Familia",
    emoji: "🏡",
    blurb: "Comunicarte mejor, poner límites sanos y cuidarte en casa.",
  },
  iden: {
    label: "Quién soy",
    short: "Identidad",
    emoji: "🌈",
    blurb: "Aceptarte, sentirte válido/a y encontrar tu gente.",
  },
};
