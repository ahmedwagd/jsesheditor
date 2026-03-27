import type { TransformParams, SvgTransformString, RotationDeg } from "@/types";
import { QUADRAT_SIZE } from "@/types";

/**
 * Builds a single SVG `transform` attribute value from TransformParams.
 *
 * Strategy:
 *  1. All transforms are applied in SVG attribute space — NOT CSS.
 *     This ensures the transform is embedded in the exported SVG markup and
 *     survives paste into Word / Google Docs without any CSS dependency.
 *  2. Rotation origin is the center of the 1800×1800 quadrat.
 *  3. Flip is implemented via scale(-1, 1) / scale(1, -1) around the same center.
 *  4. Uniform scale is applied last to avoid compounding with flip signs.
 *
 * Analogy: think of it like stacking physical transparencies —
 *  rotate the sheet first (around its center), then flip if needed,
 *  then zoom the camera. Order matters.
 */
export function buildSvgTransform(params: TransformParams): SvgTransformString {
  const { rotation, flipX, flipY, scale } = params;
  const cx = QUADRAT_SIZE / 2; // 900
  const cy = QUADRAT_SIZE / 2; // 900

  const parts: string[] = [];

  // Translate to origin, rotate, translate back
  if (rotation !== 0) {
    parts.push(`rotate(${rotation}, ${cx}, ${cy})`);
  }

  // Flip: translate to center, negate axis, translate back
  if (flipX) {
    parts.push(`translate(${QUADRAT_SIZE}, 0) scale(-1, 1)`);
  }
  if (flipY) {
    parts.push(`translate(0, ${QUADRAT_SIZE}) scale(1, -1)`);
  }

  // Uniform scale around center
  if (scale !== 1) {
    const offset = cx * (1 - scale);
    parts.push(`translate(${offset}, ${offset}) scale(${scale})`);
  }

  return parts.join(" ") || "none";
}

/**
 * Cycles through 0 → 90 → 180 → 270 → 0
 */
export function cycleRotation(
  current: RotationDeg,
  step: 90 | -90 = 90,
): RotationDeg {
  const next = (((current + step) % 360) + 360) % 360;
  return next as RotationDeg;
}

/**
 * Computes the effective viewBox for a composed sequence of glyphs.
 * Used when building the final export SVG.
 *
 * @param count - number of glyphs
 * @param gap   - horizontal gap between glyphs (internal units)
 * @param padding - outer padding (internal units)
 */
export function computeCompositionViewBox(
  count: number,
  gap: number,
  padding: number,
): { x: number; y: number; width: number; height: number } {
  const innerWidth = count * QUADRAT_SIZE + Math.max(0, count - 1) * gap;
  return {
    x: 0,
    y: 0,
    width: innerWidth + padding * 2,
    height: QUADRAT_SIZE + padding * 2,
  };
}

/**
 * Returns the x-offset for a glyph at a given position in the horizontal flow.
 */
export function glyphXOffset(
  position: number,
  gap: number,
  padding: number,
): number {
  return padding + position * (QUADRAT_SIZE + gap);
}
