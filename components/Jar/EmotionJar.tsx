import { layoutBalls } from "./layout";

export interface JarBall {
  id: number | string;
  color: string;
  label: string;
  fresh?: boolean;
}

/** Jarra SVG que se llena con bolas de colores (una por emoción registrada). */
export function EmotionJar({ balls, title, emptyText }: { balls: JarBall[]; title: string; emptyText: string }) {
  const pos = layoutBalls(balls.length);
  return (
    <svg viewBox="0 0 280 360" className="mx-auto w-full max-w-72" role="img" aria-label={title}>
      <defs>
        <clipPath id="jar-inside">
          <path d="M44 96 Q40 100 40 120 L40 318 Q40 340 62 340 L218 340 Q240 340 240 318 L240 120 Q240 100 236 96 Z" />
        </clipPath>
        <linearGradient id="glass" x1="0" x2="1">
          <stop offset="0" stopColor="var(--brand)" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="var(--brand)" stopOpacity="0.05" />
          <stop offset="1" stopColor="var(--brand)" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {/* cristal */}
      <path
        d="M44 96 Q40 100 40 120 L40 318 Q40 340 62 340 L218 340 Q240 340 240 318 L240 120 Q240 100 236 96 Z"
        fill="url(#glass)"
      />
      {/* bolas */}
      <g clipPath="url(#jar-inside)">
        {balls.map((b, i) => {
          const p = pos[i];
          return (
            <g key={b.id} className={b.fresh ? "animate-ball-drop" : undefined} style={{ ["--drop-from" as string]: `${-(p.y - 20)}px` }}>
              <circle cx={p.x} cy={p.y} r={p.r} fill={b.color} stroke="rgb(0 0 0 / 0.18)" strokeWidth="1" />
              <circle cx={p.x - p.r * 0.35} cy={p.y - p.r * 0.35} r={p.r * 0.28} fill="#fff" opacity="0.55" />
            </g>
          );
        })}
      </g>
      {/* contorno y brillo */}
      <path
        d="M44 96 Q40 100 40 120 L40 318 Q40 340 62 340 L218 340 Q240 340 240 318 L240 120 Q240 100 236 96"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M58 130 L58 300" stroke="#fff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
      {/* cuello y tapa */}
      <rect x="56" y="70" width="168" height="28" rx="8" fill="var(--surface-2)" stroke="var(--brand)" strokeWidth="5" />
      <rect x="48" y="40" width="184" height="34" rx="12" fill="var(--brand)" />
      <path d="M70 52 L210 52" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      {balls.length === 0 && (
        <text x="140" y="230" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--muted)">
          {emptyText}
        </text>
      )}
    </svg>
  );
}
