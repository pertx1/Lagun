"use client";

import { useEffect, useRef } from "react";
import type { CountryResources } from "@/config/safety";
import { HelpResources } from "./HelpResources";
import { Button } from "./Button";

/**
 * Pantalla de ayuda que aparece al instante si se detecta una posible crisis.
 * Tono calmado. No bloquea la app: se puede volver a la conversación.
 * Usa <dialog> nativo: atrapa el foco y se cierra con Esc.
 */
export function CrisisSheet({ open, onClose, resources }: { open: boolean; onClose: () => void; resources: CountryResources }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="crisis-title"
      className="m-auto max-h-[92dvh] w-[min(36rem,calc(100%-1.5rem))] overflow-y-auto rounded-3xl border-2 border-line bg-bg p-5 text-fg backdrop:bg-black/60"
    >
      <h2 id="crisis-title" className="text-2xl font-black">
        Estoy aquí contigo 💚
      </h2>
      <p className="mt-2">
        Lo que me cuentas es importante y mereces apoyo de una persona de verdad. Esta línea es gratuita,
        confidencial y te atiende alguien preparado para escucharte, sin juzgarte.
      </p>
      <p className="mb-4 mt-2 text-sm text-muted">Si puedes, díselo también a alguien de confianza que tengas cerca.</p>
      <HelpResources resources={resources} compact />
      <Button variant="secondary" className="mt-5 w-full" onClick={onClose} autoFocus>
        Volver a la conversación
      </Button>
    </dialog>
  );
}
