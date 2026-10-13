/**
 * Detección de crisis por palabras clave.
 *
 * Es una RED DE SEGURIDAD adicional al flag `crisis` que devuelve el modelo:
 * se ejecuta en el servidor (y también en el cliente para reaccionar al
 * instante). Prioriza no dejar pasar nada: preferimos un falso positivo
 * (mostrar recursos con cariño) a un falso negativo.
 *
 * El texto NO se guarda en ningún sitio; solo se analiza en memoria.
 */

export { getResources } from "@/config/safety";

/** Minúsculas, sin tildes, sin signos, espacios colapsados. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Patrones (sobre texto normalizado). Español + algo de inglés y
 * euskera frecuentes. Mantener ordenados por categoría para que sea fácil ampliar.
 */
const PATTERNS: { category: CrisisCategory; re: RegExp }[] = [
  // Suicidio / no querer vivir
  { category: "suicide", re: /\b(suicid\w*|quitarme la vida|quitar(me)? de en medio|acabar con (mi vida|todo)|matarme|me quiero morir|quiero morir(me)?|ojala (me muera|no despertar|estuviera muert[oa])|no quiero (vivir|seguir viviendo|despertar)|no (vale|merece) la pena (vivir|seguir)|mejor (si )?(no estuviera|desaparezco|estaria muert[oa])|desaparecer para siempre|tirarme (por|de) (la ventana|un puente|el balcon)|tirarme a las vias|colgarme|ahorcarme|sobredosis|tomarme todas las pastillas|despedirme de todos|carta de despedida)\b/ },
  { category: "suicide", re: /\b(kill myself|want to die|end my life|suicidal|hil nahi dut|neure burua hil)\b/ },
  // Autolesión
  { category: "self_harm", re: /\b(autolesi\w*|hacerme dano|me hago dano|cortarme|me corto|me he cortado|cortes en (los brazos|las piernas|la piel)|quemarme|me quemo|golpearme|hacerme heridas|self harm|cutting myself)\b/ },
  // Abuso / violencia
  { category: "abuse", re: /\b(abus(a|an|o|aron|ando) de mi|me (pega|pegan|pego|pegaron|maltrata|maltratan|viola|violo|violaron)|me toca(n)? sin (querer|permiso)|me obliga(n)? a (tocar|hacer cosas)|tocamientos|agresion sexual|me amenaza(n)? con (matarme|pegarme)|maltrato en casa)\b/ },
  // Peligro inmediato
  { category: "danger", re: /\b(estoy en peligro|me van a matar|tengo miedo de que me mate|no estoy a salvo)\b/ },
];

export type CrisisCategory = "suicide" | "self_harm" | "abuse" | "danger";

export interface CrisisCheck {
  crisis: boolean;
  categories: CrisisCategory[];
}

export function detectCrisis(text: string): CrisisCheck {
  const t = normalize(text);
  if (!t) return { crisis: false, categories: [] };
  const categories = new Set<CrisisCategory>();
  for (const { category, re } of PATTERNS) {
    if (re.test(t)) categories.add(category);
  }
  return { crisis: categories.size > 0, categories: [...categories] };
}

/**
 * Respuesta segura de respaldo, por si el proveedor de IA falla o se niega a
 * contestar justo cuando alguien puede estar en riesgo.
 */
export const CRISIS_FALLBACK_REPLY =
  "Gracias por contármelo. Lo que sientes es importante y no tienes por qué pasarlo a solas. " +
  "Ahora mismo te voy a enseñar algunos teléfonos donde te atiende una persona de verdad, gratis y a cualquier hora. " +
  "Si estás en peligro inmediato, llama al 112. Si puedes, cuéntaselo también a alguien de confianza que esté cerca. " +
  "Aquí sigo contigo.";
