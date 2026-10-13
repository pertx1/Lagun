import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-2xl border-2 border-line bg-bg px-4 py-3 text-fg placeholder:text-muted focus:border-primary";

export function Field({
  label,
  hint,
  id,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <input id={id} className={inputClass} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ error, info }: { error?: string; info?: string }) {
  if (!error && !info) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-2xl p-3 text-sm font-semibold ${error ? "bg-danger-soft text-danger" : "bg-surface-2 text-fg"}`}
    >
      {error ?? info}
    </p>
  );
}
