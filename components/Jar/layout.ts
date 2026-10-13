/** Geometría de la jarra (unidades del viewBox 280×360). */
export const JAR = {
  left: 46,
  right: 234,
  bottom: 330,
  top: 92,
};

export interface BallPos {
  x: number;
  y: number;
  r: number;
}

function radiusFor(count: number) {
  if (count <= 50) return 13;
  if (count <= 100) return 10;
  if (count <= 180) return 7.5;
  return 5.5;
}

/** Pseudoaleatorio estable a partir de un número (para que las bolas no "bailen" al recargar). */
function jitter(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

/**
 * Coloca las bolas de abajo arriba en filas al tresbolillo.
 * Si hay más bolas de las que caben, se apilan igual (la jarra "rebosa" visualmente hacia arriba, recortada).
 */
export function layoutBalls(count: number): BallPos[] {
  const r = radiusFor(count);
  const width = JAR.right - JAR.left;
  const perRow = Math.floor(width / (2 * r));
  const rowH = r * 1.75;
  const out: BallPos[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const offset = row % 2 ? r * 0.9 : 0;
    const usable = perRow - (row % 2 ? 1 : 0);
    const c = Math.min(col, usable - 1);
    out.push({
      x: JAR.left + r + offset + c * 2 * r + jitter(i + 1) * 2,
      y: JAR.bottom - r - row * rowH + jitter(i + 7) * 1.5,
      r: r - 0.5,
    });
  }
  return out;
}
