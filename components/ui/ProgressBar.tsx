export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.round((value / Math.max(1, max)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-3 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
