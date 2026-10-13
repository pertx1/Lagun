export interface BarItem {
  key: string;
  label: string;
  icon?: string;
  value: number;
}

/** Barras horizontales de magnitud (un solo tono). La identidad la da la etiqueta, no el color. */
export function BarList({ items, unit, ariaLabel, max: fixedMax }: { items: BarItem[]; unit?: string; ariaLabel: string; max?: number }) {
  const max = fixedMax ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2" aria-label={ariaLabel}>
      {items.map((i) => (
        <li key={i.key} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-sm" title={`${i.label}: ${i.value}${unit ? " " + unit : ""}`}>
          <span className="truncate font-bold">
            {i.icon && <span aria-hidden>{i.icon} </span>}
            {i.label}
          </span>
          <span className="h-3 rounded-r-[4px] bg-surface-2" aria-hidden>
            <span className="block h-full rounded-r-[4px] bg-primary" style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-bold tabular-nums">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}
