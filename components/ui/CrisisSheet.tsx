"use client";

import { useEffect, useRef } from "react";
import type { CountryResources } from "@/config/safety";
import { useI18n } from "@/lib/i18n/client";
import { HelpResources } from "./HelpResources";
import { Button } from "./Button";

/**
 * Pantalla de ayuda que aparece al instante si se detecta una posible crisis.
 * Tono calmado. No bloquea la app: se puede volver a la conversación.
 * Usa <dialog> nativo: atrapa el foco y se cierra con Esc.
 */
export function CrisisSheet({ open, onClose, resources }: { open: boolean; onClose: () => void; resources: CountryResources }) {
  const { t } = useI18n();
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
        {t.crisis.title}
      </h2>
      <p className="mt-2">{t.crisis.body}</p>
      <p className="mb-4 mt-2 text-sm text-muted">{t.crisis.tell}</p>
      <HelpResources resources={resources} compact />
      <Button variant="secondary" className="mt-5 w-full" onClick={onClose} autoFocus>
        {t.crisis.back}
      </Button>
    </dialog>
  );
}
