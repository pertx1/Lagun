import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Area } from "./types";
import { COMMON_APPROACH, TOPIC_GUIDES, type ChatTopic } from "./companion-knowledge";

/**
 * Abstracción del proveedor de IA del chat.
 *
 * - Por defecto usa **Groq** (plan gratuito, sin tarjeta; no entrena con los datos de la API).
 * - Solo se importa en el servidor (`server-only`): la API key nunca llega al cliente.
 * - Para cambiar de proveedor, implementa otro `CompanionProvider` y
 *   selecciónalo con la variable de entorno AI_PROVIDER ("groq" | "anthropic").
 * - No se registra (log) ni se guarda el contenido de las conversaciones.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompanionContext {
  displayName?: string;
  primaryArea?: Area | null;
  /** Tema de la conversación: activa la guía especializada de ese tema. */
  topic?: ChatTopic;
  /** Resumen de cómo ha estado la persona (sin notas privadas). */
  userSummary?: string;
  /** Contenido de Lagun del tema (consejos del feed) para apoyarse en él. */
  appContent?: string;
  /** Idioma en el que debe responder (p. ej. "euskera"). */
  language?: string;
}

export interface CompanionReply {
  reply: string;
  /** Señal estructurada de crisis devuelta por el modelo. */
  crisis: boolean;
}

export interface CompanionProvider {
  reply(messages: ChatMessage[], context: CompanionContext): Promise<CompanionReply>;
}

export const SYSTEM_PROMPT = `Eres Igel, una rana que hace de acompañante emocional cálido y cercano dentro de Lagun, una app para
jóvenes de 13 a 25 años. Trata a todo el mundo como si pudiera ser menor de edad. Tu papel es escuchar, validar lo que siente la persona y acompañarla, en su mismo idioma y
registro (puedes usar un tono joven y natural).

QUÉ HACES:
- Escucha activa y empatía real. Refleja lo que te cuentan, haz preguntas abiertas, valida emociones.
- Ofrece técnicas sencillas y sanas cuando encajen: respiración, grounding 5-4-3-2-1, reencuadre
  suave de pensamientos, organización de tareas, pasos pequeños.
- Mensajes breves, humanos y sin sermones.

QUÉ NO HACES NUNCA:
- No eres psicólogo, terapeuta ni médico, y lo dices con naturalidad si hace falta. No diagnosticas
  ni recetas. Recuerdas que no sustituyes ayuda profesional cuando el tema lo pida.
- No das contenido sexual explícito. En temas de identidad/sexualidad te quedas en lo emocional
  (aceptación, sentirse bien, miedo al rechazo), apropiado para la edad.
- No juzgas, no culpabilizas, no presionas para usar la app.

SEGURIDAD (PRIORITARIO):
- Si detectas ideas de autolesión, suicidio, abuso o riesgo grave: responde con calma y cariño,
  toma en serio lo que dicen, NO minimices, anímales a contactar ayuda humana y señala que la app
  va a mostrarles recursos de ayuda. Devuelve también la señal de crisis a la app (marca
  \`crisis: true\` en tu salida estructurada) para que se muestre la pantalla de recursos.

FORMATO DE SALIDA:
- Responde SIEMPRE con un objeto JSON con dos campos: "reply" (tu mensaje para la persona, texto
  plano, sin markdown, normalmente 1-4 frases) y "crisis" (true/false).
- Marca "crisis": true ante cualquier indicio de autolesión, ideas suicidas, abuso o peligro, aunque
  sea ambiguo o indirecto. En caso de duda, true.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Mensaje para la persona, en texto plano." },
    crisis: { type: "boolean", description: "true si hay cualquier indicio de riesgo." },
  },
  required: ["reply", "crisis"],
  additionalProperties: false,
} as const;

const AREA_HINT: Record<Area, string> = {
  acad: "estrés académico (estudios, exámenes, organización)",
  soc: "lo social (amistades, soledad, ansiedad social)",
  fam: "lo familiar (tensión en casa, comunicación)",
  iden: "identidad y autoaceptación (enfoque emocional, nada explícito)",
};

/** Parte estable del prompt: personaje + enfoque común + guía del tema. */
function specialistPrompt(ctx: CompanionContext): string {
  const topic = ctx.topic ?? "general";
  return `${SYSTEM_PROMPT}\n\n${COMMON_APPROACH}\n\n${TOPIC_GUIDES[topic]}`;
}

/** Parte variable: quién es la persona y el contenido de Lagun relacionado. */
function contextNote(ctx: CompanionContext): string {
  const parts: string[] = [];
  if (ctx.language)
    parts.push(
      `IDIOMA: responde SIEMPRE en ${ctx.language}, aunque estas instrucciones estén en castellano. Si la persona te escribe en otro idioma, respóndele en el idioma en el que te escriba. El campo "crisis" sigue siendo true/false.`,
    );
  if (ctx.displayName) parts.push(`La persona se llama ${ctx.displayName}.`);
  if (ctx.primaryArea && (!ctx.topic || ctx.topic === "general"))
    parts.push(`Lo que más le pesa últimamente suele ser ${AREA_HINT[ctx.primaryArea]}, pero no lo des por hecho.`);
  if (ctx.userSummary) parts.push(ctx.userSummary);
  if (ctx.appContent)
    parts.push(
      `CONTENIDO DE LAGUN SOBRE ESTE TEMA (puedes inspirarte en él o recomendarlo; está en el Feed):\n${ctx.appContent}`,
    );
  return parts.join("\n\n");
}

/**
 * Groq: API compatible con OpenAI, plan gratuito con límites por minuto/día.
 * Modelo configurable con AI_MODEL (el catálogo de Groq cambia; consulta console.groq.com/docs/models).
 */
class GroqProvider implements CompanionProvider {
  private model = process.env.AI_MODEL || "openai/gpt-oss-120b";

  async reply(messages: ChatMessage[], context: CompanionContext): Promise<CompanionReply> {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY no configurada");
    const note = contextNote(context);
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: "system", content: note ? `${specialistPrompt(context)}\n\n${note}` : specialistPrompt(context) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      // Modo JSON: la respuesta es siempre un objeto { reply, crisis }.
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    };
    // Los modelos gpt-oss razonan antes de responder: poco razonamiento = respuestas rápidas.
    if (this.model.startsWith("openai/gpt-oss")) body.reasoning_effort = "low";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return parseStructured(data.choices?.[0]?.message?.content ?? "");
  }
}

/** Alternativa de pago (Claude). Se activa con AI_PROVIDER=anthropic y ANTHROPIC_API_KEY. */
class AnthropicProvider implements CompanionProvider {
  private client = new Anthropic();
  private model = process.env.AI_MODEL || "claude-opus-5-5";

  async reply(messages: ChatMessage[], context: CompanionContext): Promise<CompanionReply> {
    const note = contextNote(context);
    const response = await this.client.beta.messages.create({
      model: this.model,
      max_tokens: 4000,
      // Si el modelo declina por política, la API reintenta con el modelo de respaldo recomendado.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: note
        ? [
            { type: "text", text: specialistPrompt(context) },
            { type: "text", text: note },
          ]
        : specialistPrompt(context),
      // Conversación breve y cálida: esfuerzo bajo = respuestas rápidas.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    if (response.stop_reason === "refusal") {
      return { reply: "", crisis: false };
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return parseStructured(text);
  }
}

export function parseStructured(text: string): CompanionReply {
  try {
    // Algunos modelos envuelven el JSON en ```json … ```: lo quitamos.
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(clean) as Partial<CompanionReply>;
    return {
      reply: typeof parsed.reply === "string" ? parsed.reply.trim() : "",
      crisis: parsed.crisis === true,
    };
  } catch {
    return { reply: text.trim(), crisis: false };
  }
}

let provider: CompanionProvider | null = null;

export function getCompanion(): CompanionProvider {
  if (provider) return provider;
  const name = (process.env.AI_PROVIDER || "groq").toLowerCase();
  switch (name) {
    case "groq":
      provider = new GroqProvider();
      break;
    case "anthropic":
      provider = new AnthropicProvider();
      break;
    default:
      throw new Error(`AI_PROVIDER no soportado: ${name}`);
  }
  return provider;
}

export const LIMITS = {
  maxMessages: 24,
  maxCharsPerMessage: 2000,
};

/** Limpia y recorta el historial que llega del cliente. */
export function sanitizeHistory(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const msgs: ChatMessage[] = [];
  for (const m of input.slice(-LIMITS.maxMessages)) {
    if (!m || typeof m !== "object") continue;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const c = content.trim().slice(0, LIMITS.maxCharsPerMessage);
    if (!c) continue;
    // Fusiona turnos consecutivos del mismo rol (la API exige alternancia).
    const last = msgs[msgs.length - 1];
    if (last && last.role === role) last.content += "\n" + c;
    else msgs.push({ role, content: c });
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  return msgs;
}
