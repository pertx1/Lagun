import type { FrogState } from "@/lib/types";
import { FROG_COLORS, type FrogMood, type FrogPalette } from "./palette";

interface FrogProps {
  state?: FrogState;
  mood?: FrogMood;
  size?: number;
  /** Respira suavemente (bob) y parpadea. */
  animate?: boolean;
  /** Da un saltito (para celebrar algo). */
  hop?: boolean;
  /** Muestra el rinconcito de fondo. */
  withCorner?: boolean;
  label?: string;
  className?: string;
}

/**
 * Lagun, la rana. SVG por capas:
 *   rinconcito → capa trasera (capa de héroe) → cuerpo → ropa → cara → gafas → gorro → accesorio
 * Cada capa se elige con `state` (asset_key de la tienda).
 */
export function Frog({
  state = {},
  mood = "happy",
  size = 160,
  animate = true,
  hop = false,
  withCorner = false,
  label,
  className,
}: FrogProps) {
  const p = FROG_COLORS[state.color ?? "color_verde"] ?? FROG_COLORS.color_verde;
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role={label === "" ? undefined : "img"}
      aria-hidden={label === "" ? true : undefined}
      aria-label={label === "" ? undefined : (label ?? "Lagun, la rana")}
      className={className}
    >
      {withCorner && <Corner kind={state.corner} />}
      <g className={hop ? "animate-frog-hop" : animate ? "animate-frog-bob" : undefined}>
        {state.outfit === "outfit_cape" && (
          <path d="M52 112 Q100 96 148 112 L166 186 Q100 196 34 186 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" />
        )}
        <Body p={p} />
        <Outfit kind={state.outfit} p={p} />
        <Face mood={mood} p={p} animate={animate} />
        <Glasses kind={state.glasses} />
        <Hat kind={state.hat} />
        <Accessory kind={state.accessory} />
      </g>
    </svg>
  );
}

function Body({ p }: { p: FrogPalette }) {
  return (
    <g stroke={p.line} strokeWidth="3" strokeLinejoin="round">
      {/* patas */}
      <ellipse cx="62" cy="182" rx="22" ry="9" fill={p.shade} />
      <ellipse cx="138" cy="182" rx="22" ry="9" fill={p.shade} />
      {/* cuerpo */}
      <ellipse cx="100" cy="146" rx="58" ry="42" fill={p.body} />
      {/* cabeza */}
      <ellipse cx="100" cy="102" rx="72" ry="50" fill={p.body} />
      {/* bultos de los ojos */}
      <circle cx="64" cy="64" r="25" fill={p.body} />
      <circle cx="136" cy="64" r="25" fill={p.body} />
      {/* tapa el trazo interno entre cabeza y bultos */}
      <ellipse cx="100" cy="98" rx="68" ry="44" fill={p.body} stroke="none" />
      <ellipse cx="100" cy="140" rx="54" ry="38" fill={p.body} stroke="none" />
      {/* barriga */}
      <ellipse cx="100" cy="152" rx="36" ry="26" fill={p.belly} stroke="none" />
      {/* bracitos */}
      <path d="M50 140 Q40 156 54 164" fill="none" />
      <path d="M150 140 Q160 156 146 164" fill="none" />
    </g>
  );
}

function Face({ mood, p, animate }: { mood: FrogMood; p: FrogPalette; animate: boolean }) {
  const closed = mood === "sleepy";
  const halfClosed = mood === "calm";
  const eyeClass = animate && !closed ? "frog-eye" : undefined;
  return (
    <g>
      {/* ojos */}
      {closed ? (
        <g stroke={p.line} strokeWidth="3.5" fill="none" strokeLinecap="round">
          <path d="M52 66 Q64 74 76 66" />
          <path d="M124 66 Q136 74 148 66" />
        </g>
      ) : (
        <g className={eyeClass}>
          <circle cx="64" cy="64" r="16" fill="#fff" stroke={p.line} strokeWidth="2.5" />
          <circle cx="136" cy="64" r="16" fill="#fff" stroke={p.line} strokeWidth="2.5" />
          <circle cx={mood === "worried" ? 62 : 66} cy={mood === "sad" ? 68 : 65} r="8" fill="#0B1F1D" />
          <circle cx={mood === "worried" ? 134 : 138} cy={mood === "sad" ? 68 : 65} r="8" fill="#0B1F1D" />
          <circle cx="69" cy="61" r="3" fill="#fff" />
          <circle cx="141" cy="61" r="3" fill="#fff" />
          {halfClosed && (
            <g fill={p.body} stroke={p.line} strokeWidth="2.5">
              <path d="M47 62 Q64 44 81 62 Z" />
              <path d="M119 62 Q136 44 153 62 Z" />
            </g>
          )}
        </g>
      )}
      {/* cejas para preocupación / tristeza */}
      {(mood === "worried" || mood === "sad") && (
        <g stroke={p.line} strokeWidth="3" strokeLinecap="round">
          <path d={mood === "worried" ? "M52 42 L74 38" : "M54 40 L74 46"} />
          <path d={mood === "worried" ? "M148 42 L126 38" : "M146 40 L126 46"} />
        </g>
      )}
      {/* mofletes */}
      <circle cx="54" cy="112" r="9" fill="#FB7185" opacity="0.55" />
      <circle cx="146" cy="112" r="9" fill="#FB7185" opacity="0.55" />
      {/* boca */}
      <g stroke={p.line} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {mood === "happy" && <path d="M76 112 Q100 134 124 112" />}
        {mood === "excited" && <path d="M74 110 Q100 142 126 110 Z" fill="#9F1239" />}
        {mood === "calm" && <path d="M86 116 Q100 126 114 116" />}
        {mood === "sad" && <path d="M82 124 Q100 110 118 124" />}
        {mood === "worried" && <path d="M80 120 Q90 112 100 120 Q110 128 120 120" />}
        {mood === "sleepy" && <ellipse cx="100" cy="120" rx="6" ry="5" />}
      </g>
      {mood === "sleepy" && (
        <text x="150" y="36" fontSize="18" fontWeight="800" fill={p.line}>
          z
        </text>
      )}
      {mood === "sad" && <path d="M78 82 Q74 92 78 96 Q82 92 78 82 Z" fill="#60A5FA" />}
    </g>
  );
}

function Glasses({ kind }: { kind?: string }) {
  if (!kind) return null;
  if (kind === "glasses_round")
    return (
      <g fill="none" stroke="#1F2937" strokeWidth="3.5">
        <circle cx="64" cy="64" r="20" />
        <circle cx="136" cy="64" r="20" />
        <path d="M84 64 Q100 56 116 64" />
      </g>
    );
  if (kind === "glasses_sun")
    return (
      <g stroke="#111827" strokeWidth="3">
        <rect x="40" y="50" width="48" height="30" rx="12" fill="#111827" opacity="0.92" />
        <rect x="112" y="50" width="48" height="30" rx="12" fill="#111827" opacity="0.92" />
        <path d="M88 62 L112 62" fill="none" />
        <path d="M48 58 L60 56" stroke="#fff" strokeWidth="3" opacity="0.6" />
      </g>
    );
  if (kind === "glasses_heart")
    return (
      <g stroke="#9D174D" strokeWidth="3" fill="#F472B6" fillOpacity="0.85">
        <path d="M64 86 L42 64 A12 12 0 0 1 64 50 A12 12 0 0 1 86 64 Z" />
        <path d="M136 86 L114 64 A12 12 0 0 1 136 50 A12 12 0 0 1 158 64 Z" />
        <path d="M86 62 L114 62" fill="none" />
      </g>
    );
  return null;
}

function Hat({ kind }: { kind?: string }) {
  if (!kind) return null;
  if (kind === "hat_beanie")
    return (
      <g stroke="#7C2D12" strokeWidth="3">
        <path d="M58 52 Q100 -6 142 52 Z" fill="#F97316" />
        <rect x="54" y="44" width="92" height="14" rx="7" fill="#FDBA74" />
        <circle cx="100" cy="16" r="9" fill="#FED7AA" />
      </g>
    );
  if (kind === "hat_cap")
    return (
      <g stroke="#1E3A8A" strokeWidth="3">
        <path d="M62 50 Q100 8 138 50 Z" fill="#3B82F6" />
        <path d="M128 48 Q160 44 172 54 Q150 58 128 54 Z" fill="#1D4ED8" />
        <circle cx="100" cy="24" r="4" fill="#1E3A8A" />
      </g>
    );
  if (kind === "hat_flowers")
    return (
      <g>
        {[54, 76, 100, 124, 146].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i % 2 ? 36 : 42})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <circle
                key={a}
                cx={Math.cos((a * Math.PI) / 180) * 6}
                cy={Math.sin((a * Math.PI) / 180) * 6}
                r="5"
                fill={["#F472B6", "#FDE047", "#A78BFA", "#FB923C", "#F9A8D4"][i]}
              />
            ))}
            <circle r="3.5" fill="#FEF08A" />
          </g>
        ))}
      </g>
    );
  if (kind === "hat_headphones")
    return (
      <g stroke="#111827" strokeWidth="3">
        <path d="M34 86 Q30 14 100 14 Q170 14 166 86" fill="none" strokeWidth="8" stroke="#374151" />
        <rect x="22" y="72" width="22" height="34" rx="9" fill="#14B8A6" />
        <rect x="156" y="72" width="22" height="34" rx="9" fill="#14B8A6" />
      </g>
    );
  if (kind === "hat_crown")
    return (
      <g stroke="#92400E" strokeWidth="3" strokeLinejoin="round">
        <path d="M70 46 L74 14 L88 32 L100 8 L112 32 L126 14 L130 46 Z" fill="#FACC15" />
        <circle cx="100" cy="36" r="4" fill="#EF4444" stroke="none" />
      </g>
    );
  return null;
}

function Outfit({ kind, p }: { kind?: string; p: FrogPalette }) {
  if (!kind || kind === "outfit_cape") {
    if (kind === "outfit_cape")
      return <path d="M66 128 Q100 140 134 128 L128 138 Q100 148 72 138 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" />;
    return null;
  }
  if (kind === "outfit_scarf")
    return (
      <g stroke="#7F1D1D" strokeWidth="2.5">
        <path d="M44 124 Q100 148 156 124 L154 138 Q100 162 46 138 Z" fill="#EF4444" />
        <path d="M128 136 L136 172 L120 170 L116 140 Z" fill="#EF4444" />
        <path d="M60 130 L60 142 M80 136 L80 148 M100 138 L100 150 M120 136 L120 148" stroke="#FCA5A5" />
      </g>
    );
  if (kind === "outfit_bowtie")
    return (
      <g stroke="#312E81" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M100 132 L76 120 L76 146 Z" fill="#6366F1" />
        <path d="M100 132 L124 120 L124 146 Z" fill="#6366F1" />
        <circle cx="100" cy="132" r="6" fill="#4338CA" />
      </g>
    );
  if (kind === "outfit_hoodie")
    return (
      <g stroke={p.line} strokeWidth="3">
        <path d="M44 132 Q100 118 156 132 Q162 170 144 184 L56 184 Q38 170 44 132 Z" fill="#8B5CF6" />
        <path d="M80 152 L120 152 L116 172 L84 172 Z" fill="#7C3AED" />
        <path d="M88 128 L86 146 M112 128 L114 146" stroke="#EDE9FE" />
      </g>
    );
  return null;
}

function Accessory({ kind }: { kind?: string }) {
  if (!kind) return null;
  if (kind === "acc_tea")
    return (
      <g stroke="#7C2D12" strokeWidth="2.5" transform="translate(150 140)">
        <path d="M0 0 L26 0 L22 26 Q13 30 4 26 Z" fill="#FDBA74" />
        <path d="M26 6 Q36 8 26 18" fill="none" />
        <path d="M8 -6 Q12 -14 8 -20 M16 -6 Q20 -14 16 -20" fill="none" stroke="#94A3B8" />
      </g>
    );
  if (kind === "acc_book")
    return (
      <g stroke="#1E3A8A" strokeWidth="2.5" transform="translate(146 136)">
        <rect x="0" y="0" width="30" height="38" rx="3" fill="#60A5FA" />
        <path d="M6 0 L6 38" />
        <path d="M12 10 L24 10 M12 16 L22 16" stroke="#DBEAFE" />
      </g>
    );
  if (kind === "acc_plant")
    return (
      <g transform="translate(150 136)">
        <path d="M2 22 L30 22 L26 44 L6 44 Z" fill="#C2410C" stroke="#7C2D12" strokeWidth="2.5" />
        <path d="M16 22 Q4 6 10 -2 Q18 8 16 22 Q26 4 34 6 Q30 18 16 22" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
      </g>
    );
  if (kind === "acc_balloon")
    return (
      <g transform="translate(160 40)">
        <path d="M10 46 Q4 80 -8 118" fill="none" stroke="#475569" strokeWidth="2" />
        <ellipse cx="10" cy="22" rx="18" ry="24" fill="#F43F5E" stroke="#881337" strokeWidth="2.5" />
        <path d="M4 10 Q8 4 14 6" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" />
      </g>
    );
  return null;
}

function Corner({ kind }: { kind?: string }) {
  switch (kind) {
    case "corner_cushion":
      return <ellipse cx="100" cy="188" rx="90" ry="16" fill="#FDA4AF" stroke="#BE123C" strokeWidth="2" />;
    case "corner_lights":
      return (
        <g>
          <path d="M0 20 Q50 44 100 20 Q150 44 200 20" fill="none" stroke="#64748B" strokeWidth="1.5" />
          {[16, 46, 76, 100, 124, 154, 184].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 32 : 28} r="5" fill={["#FDE047", "#F472B6", "#5EEAD4", "#FB923C"][i % 4]} />
          ))}
        </g>
      );
    case "corner_rainbow":
      return (
        <g fill="none" strokeWidth="9" opacity="0.8">
          {["#F87171", "#FB923C", "#FACC15", "#4ADE80", "#60A5FA", "#A78BFA"].map((c, i) => (
            <path key={c} d={`M${10 + i * 9} 200 A${90 - i * 9} ${90 - i * 9} 0 0 1 ${190 - i * 9} 200`} stroke={c} />
          ))}
        </g>
      );
    case "corner_night":
      return (
        <g>
          <rect x="0" y="0" width="200" height="200" rx="28" fill="#1E1B4B" />
          {[
            [24, 30], [60, 18], [150, 26], [176, 60], [30, 80], [170, 110], [110, 14],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#FEF9C3" />
          ))}
          <circle cx="168" cy="30" r="12" fill="#FEF08A" />
        </g>
      );
    case "corner_lily":
    default:
      return <ellipse cx="100" cy="186" rx="88" ry="14" fill="#86EFAC" stroke="#15803D" strokeWidth="2" opacity="0.9" />;
  }
}
