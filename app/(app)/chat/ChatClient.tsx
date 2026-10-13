"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { awardActivity } from "@/app/actions";
import { detectCrisis } from "@/lib/safety";
import type { CountryResources } from "@/config/safety";
import type { FrogState } from "@/lib/types";
import { Frog } from "@/components/Frog/Frog";
import { CrisisSheet } from "@/components/ui/CrisisSheet";
import { inputClass } from "@/components/ui/Field";

interface Msg {
  id: number;
  role: "user" | "assistant";
  content: string;
}

/**
 * Chat EFÍMERO: los mensajes viven solo en el estado de este componente.
 * Nada en localStorage, sessionStorage, IndexedDB ni base de datos.
 * Se borra al cerrar, al salir de la pantalla y al ocultar/cerrar la página.
 */
export function ChatClient({ name, resources, frogState }: { name: string; resources: CountryResources; frogState: FrogState }) {
  const router = useRouter();
  const greeting: Msg = {
    id: 0,
    role: "assistant",
    content: `Hola, ${name} 🐸 Aquí puedes contarme lo que quieras, sin juicios. ¿Cómo estás ahora mismo?`,
  };
  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisSeen, setCrisisSeen] = useState(false);
  const nextId = useRef(1);
  const rewarded = useRef(false);
  const listRef = useRef<HTMLOListElement>(null);
  const controller = useRef<AbortController | null>(null);

  function wipe() {
    controller.current?.abort();
    setMessages([greeting]);
    setDraft("");
    setSending(false);
    nextId.current = 1;
  }

  // Al salir de la pantalla (desmontar u ocultar con <Activity>), se borra todo.
  useLayoutEffect(() => {
    return () => wipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cerrar la pestaña o volver desde la caché del navegador (bfcache), también.
  useEffect(() => {
    const onHide = () => wipe();
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) wipe();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("pageshow", onShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function openCrisis() {
    setCrisisOpen(true);
    setCrisisSeen(true);
  }

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    const userMsg: Msg = { id: nextId.current++, role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setDraft("");
    setSending(true);

    // Detección inmediata en el cliente: no esperamos a la IA para ofrecer ayuda.
    if (detectCrisis(text).crisis) openCrisis();

    controller.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.current.signal,
        // El saludo inicial es local: no se envía.
        body: JSON.stringify({ messages: history.filter((m) => m.id !== 0).map(({ role, content }) => ({ role, content })) }),
      });
      const data = (await res.json()) as { reply?: string; crisis?: boolean };
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: "assistant",
          content: data.reply || "Perdona, algo ha fallado. ¿Lo intentamos otra vez?",
        },
      ]);
      if (data.crisis) openCrisis();
      const userTurns = history.filter((m) => m.role === "user").length;
      if (!rewarded.current && userTurns >= 2) {
        rewarded.current = true;
        awardActivity("chat").catch(() => {});
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((m) => [
          ...m,
          { id: nextId.current++, role: "assistant", content: "Uy, se ha cortado la conexión. ¿Me lo repites cuando puedas?" },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  function close() {
    wipe();
    router.push("/home");
  }

  return (
    <div className="flex min-h-[calc(100dvh-13rem)] flex-col">
      <div className="mb-3 flex items-start gap-3 rounded-2xl bg-surface p-3 text-sm">
        <span aria-hidden className="text-xl">🔒</span>
        <p>
          <strong>Esta conversación no se guarda.</strong> Al salir, se borra. Lagun te escucha y acompaña, pero no es
          psicólogo/a ni sustituye ayuda profesional.
        </p>
      </div>

      <ol ref={listRef} className="flex flex-1 flex-col gap-3" aria-live="polite" aria-label="Conversación">
        {messages.map((m) => (
          <li key={m.id} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && <Frog state={frogState} size={34} animate={false} mood="calm" label="" />}
            <p
              className={`max-w-[80%] whitespace-pre-wrap rounded-3xl px-4 py-2.5 ${
                m.role === "user" ? "rounded-br-md bg-primary text-on-primary" : "rounded-bl-md bg-surface"
              }`}
            >
              <span className="sr-only">{m.role === "user" ? "Tú: " : "Lagun: "}</span>
              {m.content}
            </p>
          </li>
        ))}
        {sending && (
          <li className="flex items-end gap-2" aria-label="Lagun está escribiendo">
            <Frog state={frogState} size={34} animate={false} mood="calm" label="" />
            <p className="rounded-3xl rounded-bl-md bg-surface px-4 py-2.5 text-muted">
              <span className="animate-pulse">escribiendo…</span>
            </p>
          </li>
        )}
      </ol>

      {crisisSeen && !crisisOpen && (
        <button
          type="button"
          onClick={openCrisis}
          className="mt-3 rounded-2xl border-2 border-danger p-2 text-sm font-bold text-danger"
        >
          Ver teléfonos de ayuda
        </button>
      )}

      <form
        className="sticky bottom-20 mt-4 flex items-end gap-2 bg-bg pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Escribe tu mensaje
        </label>
        <textarea
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Escribe aquí…"
          autoComplete="off"
          className={`${inputClass} max-h-32 resize-none`}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-xl text-on-primary disabled:opacity-50"
          aria-label="Enviar"
        >
          ➤
        </button>
      </form>
      <button type="button" onClick={close} className="mt-2 self-center text-sm font-bold text-muted underline">
        Cerrar y borrar conversación
      </button>

      <CrisisSheet open={crisisOpen} onClose={() => setCrisisOpen(false)} resources={resources} />
    </div>
  );
}
