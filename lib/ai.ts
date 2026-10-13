import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Area } from "./types";

/**
 * Abstracción del proveedor de IA del chat.
 *
 * - Solo se importa en el servidor (`server-only`): la API key nunca llega al cliente.
 * - Para cambiar de proveedor, implementa otro `CompanionProvider` y
 *   selecciónalo con la variable de entorno AI_PROVIDER.
 * - No se registra (log) ni se guarda el contenido de las conversaciones.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompanionContext {
  displayName?: string;
  primaryArea?: Area | null;
  isMinor?: boolean;
}

export interface CompanionReply {
  reply: string;
  /** Señal estructurada de crisis devuelta por el modelo. */
  crisis: boolean;
}

export interface CompanionProvider {
  reply(messages: ChatMessage[], context: CompanionContext): Promise<CompanionReply>;
}

export const SYSTEM_PROMPT = `Eres Lagun, un/a acompañante emocional cálido y cercano dentro de una app para jóvenes de 13 a 25
años. Tu papel es escuchar, validar lo que siente la persona y acompañarla, en su mismo idioma y
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

function contextNote(ctx: CompanionContext): string {
  const parts: string[] = [];
  if (ctx.displayName) parts.push(`La persona se llama ${ctx.displayName}.`);
  if (ctx.isMinor) parts.push("Es menor de edad: cuida especialmente el lenguaje y la seguridad.");
  if (ctx.primaryArea) parts.push(`Lo que más le pesa últimamente suele ser ${AREA_HINT[ctx.primaryArea]}, pero no lo des por hecho.`);
  return parts.join(" ");
}

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
            { type: "text", text: SYSTEM_PROMPT },
            { type: "text", text: note },
          ]
        : SYSTEM_PROMPT,
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
    const parsed = JSON.parse(text) as Partial<CompanionReply>;
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
  const name = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  switch (name) {
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
