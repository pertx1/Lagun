/** Utilidades de fecha en la zona horaria de la persona. */

export function partsInTz(date: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    ymd: `${p.year}-${p.month}-${p.day}`,
    hour: Number(p.hour),
    weekday: weekdays.indexOf(p.weekday),
  };
}

export function safeTz(tz: string | null | undefined) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz || "Europe/Madrid" });
    return tz || "Europe/Madrid";
  } catch {
    return "Europe/Madrid";
  }
}

export function daysBetween(a: Date, b: Date) {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}

/** Días que faltan hasta una fecha YYYY-MM-DD desde "hoy" (YYYY-MM-DD). */
export function daysUntil(dueYmd: string, todayYmd: string) {
  const d = Date.UTC(+dueYmd.slice(0, 4), +dueYmd.slice(5, 7) - 1, +dueYmd.slice(8, 10));
  const t = Date.UTC(+todayYmd.slice(0, 4), +todayYmd.slice(5, 7) - 1, +todayYmd.slice(8, 10));
  return Math.round((d - t) / 86_400_000);
}

export function greeting(hour: number) {
  if (hour < 6) return "Hola, noctámbulo/a";
  if (hour < 13) return "Buenos días";
  if (hour < 21) return "Buenas tardes";
  return "Buenas noches";
}
