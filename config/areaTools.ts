import type { Area } from "@/lib/types";

export interface AreaTool {
  slug: string;
  title: string;
  emoji: string;
  desc: string;
  /** Si existe, el cuadradito lleva a otra pantalla en vez de abrir la herramienta. */
  href?: string;
}

const feed = (a: Area): AreaTool => ({ slug: "feed", title: "Feed", emoji: "📰", desc: "Frases, historias y consejos", href: `/feed?ver=${a}` });
const igel = (a: Area): AreaTool => ({ slug: "igel", title: "Hablar con Igel", emoji: "🐸", desc: "Igel, centrado en este tema", href: `/chat?tema=${a}` });
const progreso: AreaTool = { slug: "progreso", title: "Progreso", emoji: "📈", desc: "Cómo vas", href: "/stats" };

/** Cuadraditos de cada apartado. */
export const AREA_TOOLS: Record<Area, AreaTool[]> = {
  acad: [
    { slug: "calendario", title: "Exámenes", emoji: "🗓️", desc: "Exámenes y entregas a la vista" },
    { slug: "pomodoro", title: "Pomodoro", emoji: "🍅", desc: "25 min de foco, 5 de descanso" },
    { slug: "metodos", title: "Métodos de estudio", emoji: "🧠", desc: "Estudiar mejor, no más" },
    igel("acad"),
    feed("acad"),
    progreso,
  ],
  soc: [
    { slug: "reto", title: "Reto amable", emoji: "🌱", desc: "Un pasito para conectar" },
    { slug: "situaciones", title: "Situaciones", emoji: "🎭", desc: "Practica sin presión" },
    { slug: "habilidades", title: "Habilidades", emoji: "🤝", desc: "Hablar, escuchar, conectar" },
    { slug: "desahogo", title: "Desahógate", emoji: "🎈", desc: "Escribe y suéltalo" },
    igel("soc"),
    feed("soc"),
    progreso,
  ],
  fam: [
    { slug: "comunicacion", title: "Comunicación", emoji: "💬", desc: "Decir lo que sientes sin atacar" },
    { slug: "limites", title: "Límites y conflictos", emoji: "🧱", desc: "Cuidarte en casa" },
    igel("fam"),
    feed("fam"),
    progreso,
  ],
  iden: [
    { slug: "afirmaciones", title: "Para recordarte", emoji: "🌈", desc: "Eres válido/a" },
    { slug: "autoaceptacion", title: "Autoaceptación", emoji: "🪞", desc: "Quererte a tu ritmo" },
    { slug: "organizaciones", title: "Tu gente", emoji: "🫂", desc: "Organizaciones de confianza" },
    igel("iden"),
    feed("iden"),
    progreso,
  ],
};

export function isArea(x: string): x is Area {
  return x === "acad" || x === "soc" || x === "fam" || x === "iden";
}
