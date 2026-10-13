"use client";

import { useTransition } from "react";
import { deleteExam } from "@/app/actions";

export function ExamDeleteButton({ id, label }: { id: number; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteExam(id))}
      className="rounded-full p-2 text-muted hover:bg-surface-2"
      aria-label={`Borrar ${label}`}
    >
      <span aria-hidden>✕</span>
    </button>
  );
}
