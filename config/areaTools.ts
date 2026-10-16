import type { Area } from "@/lib/types";

export interface AreaTool {
  /** Clave en t.tools (título y descripción traducidos). */
  slug: string;
  emoji: string;
  /** Si existe, el cuadradito lleva a otra pantalla en vez de abrir la herramienta. */
  href?: string;
}

const extras = (a: Area): AreaTool[] => [
  { slug: "igel", emoji: "🐸", href: `/chat?tema=${a}` },
  { slug: "feed", emoji: "📰", href: `/feed?ver=${a}` },
  { slug: "progreso", emoji: "📈", href: "/stats" },
];

/** Cuadraditos de cada apartado. */
export const AREA_TOOLS: Record<Area, AreaTool[]> = {
  acad: [
    { slug: "calendario", emoji: "🗓️" },
    { slug: "pomodoro", emoji: "🍅" },
    { slug: "metodos", emoji: "🧠" },
    ...extras("acad"),
  ],
  soc: [
    { slug: "reto", emoji: "🌱" },
    { slug: "situaciones", emoji: "🎭" },
    { slug: "habilidades", emoji: "🤝" },
    { slug: "desahogo", emoji: "🎈" },
    ...extras("soc"),
  ],
  fam: [{ slug: "comunicacion", emoji: "💬" }, { slug: "limites", emoji: "🧱" }, ...extras("fam")],
  iden: [
    { slug: "afirmaciones", emoji: "🌈" },
    { slug: "autoaceptacion", emoji: "🪞" },
    { slug: "organizaciones", emoji: "🫂" },
    ...extras("iden"),
  ],
};

export function isArea(x: string): x is Area {
  return x === "acad" || x === "soc" || x === "fam" || x === "iden";
}
