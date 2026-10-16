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
 * Patrones (sobre texto normalizado: minúsculas, sin tildes, sin apóstrofos ni guiones).
 * Castellano, català, euskara, galego e English. Mantener ordenados por idioma y
 * categoría para que sea fácil ampliar. ⚠️ Conviene revisarlos con hablantes nativos.
 */
const PATTERNS: { category: CrisisCategory; re: RegExp }[] = [
  // ── Castellano ──
  { category: "suicide", re: /\b(suicid\w*|quitarme la vida|quitar(me)? de en medio|acabar con (mi vida|todo)|matarme|me quiero morir|quiero morir(me)?|ojala (me muera|no despertar|estuviera muert[oa])|no quiero (vivir|seguir viviendo|despertar)|no (vale|merece) la pena (vivir|seguir)|mejor (si )?(no estuviera|desaparezco|estaria muert[oa])|desaparecer para siempre|tirarme (por|de) (la ventana|un puente|el balcon)|tirarme a las vias|colgarme|ahorcarme|sobredosis|tomarme todas las pastillas|despedirme de todos|carta de despedida)\b/ },
  { category: "self_harm", re: /\b(autolesi\w*|hacerme dano|me hago dano|cortarme|me corto|me he cortado|cortes en (los brazos|las piernas|la piel)|quemarme|me quemo|golpearme|hacerme heridas)\b/ },
  { category: "abuse", re: /\b(abus(a|an|o|aron|ando) de mi|me (pega|pegan|pego|pegaron|maltrata|maltratan|viola|violo|violaron)|me toca(n)? sin (querer|permiso)|me obliga(n)? a (tocar|hacer cosas)|tocamientos|agresion sexual|me amenaza(n)? con (matarme|pegarme)|maltrato en casa)\b/ },
  { category: "danger", re: /\b(estoy en peligro|me van a matar|tengo miedo de que me mate|no estoy a salvo)\b/ },
  // ── Català ──
  { category: "suicide", re: /\b(em vull morir|vull morir( me)?|no vull (viure|seguir vivint)|no val la pena (viure|seguir)|matar me|treure m la vida|acabar amb (tot|la meva vida)|tant de bo (no em despertes|estigues mort[a]?)|desapareixer per sempre|llencar me (per|des de) (la finestra|un pont|el balco))\b/ },
  { category: "self_harm", re: /\b(fer me mal|em faig mal|tallar me|em tallo|m he tallat|cremar me|autolesionar me)\b/ },
  { category: "abuse", re: /\b(em (pega|peguen|maltracta|maltracten)|m (han|ha) violat|abusa(va|en)? de mi|em toca(va|en)? sense (voler|permis)|maltractament a casa)\b/ },
  { category: "danger", re: /\b(estic en perill|em mataran|no estic (segur|segura|a salvo))\b/ },
  // ── Galego ──
  { category: "suicide", re: /\b(quero morrer|non quero (vivir|seguir vivindo|espertar)|non (paga|merece) a pena (vivir|seguir)|matarme|quitarme a vida|acabar con (todo|a mina vida)|oxala (morra|non esperte)|desaparecer para sempre|tirarme (pola|da) (venta|ventana|ponte))\b/ },
  { category: "self_harm", re: /\b(facerme dano|fagome dano|cortome|cortarme|queimarme)\b/ },
  { category: "abuse", re: /\b(pegame|peganme|pegaronme|abusa de min|abusou de min|maltratame|violoume)\b/ },
  { category: "danger", re: /\b(estou en perigo|vanme matar|non estou a salvo)\b/ },
  // ── Euskara ──
  { category: "suicide", re: /\b(hil nahi (dut|naiz)|neure burua hil|nire burua hil|bere buruaz beste|nire buruaz beste|ez dut bizi nahi|bizitzeko gogorik ez|bizitzeak ez du merezi|desagertu nahi dut)\b/ },
  { category: "self_harm", re: /\b(nire buruari min|neure buruari min|min egin nahi diot nire buruari|ebakiak egiten|nire burua ebaki)\b/ },
  { category: "abuse", re: /\b(jotzen (nau|naute)|tratu txarrak|sexu erasoa|bortxatu (nau|naute)|abusatu (nau|naute))\b/ },
  { category: "danger", re: /\b(arriskuan nago|hil egingo naute)\b/ },
  // ── English ──
  { category: "suicide", re: /\b(kill myself|want to die|wanna die|end my life|end it all|suicidal|don t want to (live|be alive|wake up)|no reason to live|better off dead|take my (own )?life)\b/ },
  { category: "self_harm", re: /\b(self harm\w*|hurt(ing)? myself|cut(ting)? myself|burn(ing)? myself)\b/ },
  { category: "abuse", re: /\b((he|she|they|my \w+) (hits|beats|hurts|abuses) me|sexually abused|raped me|touches me without)\b/ },
  { category: "danger", re: /\b(i m in danger|i am in danger|i m not safe|i am not safe|going to kill me)\b/ },
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
