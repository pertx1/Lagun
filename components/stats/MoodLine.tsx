"use client";

import { useState } from "react";
import { MOOD_EMOJI, MOOD_LABELS } from "@/config/emotions";

export interface MoodPoint {
  /** YYYY-MM-DD */
  day: string;
  /** media del día 0..4 */
  mood: number;
}

const W = 320;
const H = 170;
const PAD = { l: 30, r: 10, t: 12, b: 24 };

function fmt(day: string) {
  return new Date(day + "T12:00:00Z").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** Evolución del ánimo (una serie, sin leyenda: el título la nombra). Hover con cruz + tooltip. */
export function MoodLine({ points, fromDay, toDay }: { points: MoodPoint[]; fromDay: string; toDay: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const t0 = Date.parse(fromDay + "T00:00:00Z");
  const t1 = Math.max(t0 + 86_400_000, Date.parse(toDay + "T00:00:00Z"));
  const x = (day: string) => PAD.l + ((Date.parse(day + "T00:00:00Z") - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (m: number) => PAD.t + (1 - m / 4) * (H - PAD.t - PAD.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)} ${y(p.mood).toFixed(1)}`).join(" ");

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const dd = Math.abs(x(p.day) - px);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    });
    setHover(points.length ? best : null);
  }

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Ánimo de los últimos días: ${points.length} días con check-in.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {[0, 1, 2, 3, 4].map((m) => (
          <g key={m}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(m)} y2={y(m)} stroke="var(--line)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(m) + 5} textAnchor="end" fontSize="13">
              {MOOD_EMOJI[m]}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 6} fontSize="11" fill="var(--muted)">{fmt(fromDay)}</text>
        <text x={W - PAD.r} y={H - 6} fontSize="11" fill="var(--muted)" textAnchor="end">{fmt(toDay)}</text>
        {points.length > 1 && <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <circle
            key={p.day}
            cx={x(p.day)}
            cy={y(p.mood)}
            r={hover === i ? 6 : 4}
            fill="var(--primary)"
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}
        {hp && (
          <line x1={x(hp.day)} x2={x(hp.day)} y1={PAD.t} y2={H - PAD.b} stroke="var(--muted)" strokeDasharray="3 3" strokeWidth="1" />
        )}
      </svg>
      {hp && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl border border-line bg-bg px-3 py-1.5 text-sm shadow-soft"
          style={{ left: `${(x(hp.day) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="font-bold">{fmt(hp.day)}</p>
          <p>
            {MOOD_EMOJI[Math.round(hp.mood)]} {MOOD_LABELS[Math.round(hp.mood)]}
          </p>
        </div>
      )}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-bold text-accent">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr><th className="py-1">Día</th><th>Ánimo</th></tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.day} className="border-t border-line">
                <td className="py-1">{fmt(p.day)}</td>
                <td>{MOOD_LABELS[Math.round(p.mood)]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
