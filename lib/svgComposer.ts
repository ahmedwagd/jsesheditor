import type { GlyphState, ExportSize } from "@/types";
import { EXPORT_SIZES, QUADRAT_SIZE, DEFAULT_LAYOUT } from "@/types";
import {
  buildSvgTransform,
  computeCompositionViewBox,
  glyphXOffset,
} from "./transform";

/**
 * Composes a sequence of GlyphState entries into a single valid SVG string.
 *
 * Key design decisions:
 *  - All transforms are baked into SVG `transform` attributes (not CSS).
 *    This ensures the output is self-contained and stays vector-sharp
 *    when embedded into Word, Google Docs, or Illustrator.
 *  - The outer <svg> carries an explicit viewBox AND optional width/height
 *    for export sizing. The viewBox is what guarantees infinite scalability;
 *    width/height is just a hint to the embedding app.
 *  - Each glyph's SVG content is inlined as a <g> child, wrapped in a
 *    position-translate so the horizontal flow layout is preserved.
 *
 * @param glyphs      - ordered array of glyph states to render
 * @param svgContents - map of gardinerCode → raw SVG content string
 * @param exportSize  - optional output size hint (for copy presets)
 */
export function composeSvg(
  glyphs: GlyphState[],
  svgContents: Map<string, string>,
  exportSize?: ExportSize,
): string {
  const { gap, padding } = DEFAULT_LAYOUT;
  const vb = computeCompositionViewBox(glyphs.length, gap, padding);
  const viewBoxAttr = `${vb.x} ${vb.y} ${vb.width} ${vb.height}`;

  const sizeAttr = exportSize
    ? `width="${EXPORT_SIZES[exportSize].width}" height="${EXPORT_SIZES[exportSize].height}"`
    : `width="${vb.width}" height="${vb.height}"`;

  const glyphElements = glyphs
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((glyph) => {
      const rawSvg =
        svgContents.get(glyph.gardinerCode) ??
        placeholderSvg(glyph.gardinerCode);
      const innerPaths = sanitizeSvgInner(extractSvgInner(rawSvg));
      const intrinsic = extractViewBox(rawSvg);
      const s = intrinsic
        ? QUADRAT_SIZE / Math.max(intrinsic.width, intrinsic.height)
        : 1;
      const normalize = s !== 1 ? `scale(${s}) ` : "";
      const transform = `${normalize}${buildSvgTransform({
        rotation: glyph.rotation,
        flipX: glyph.flipX,
        flipY: glyph.flipY,
        scale: glyph.scale,
      })}`;
      const x = glyphXOffset(glyph.position, gap, padding);

      return [
        `  <g id="glyph-${glyph.instanceId}" data-code="${glyph.gardinerCode}">`,
        `    <svg x="${x}" y="${padding}" width="${QUADRAT_SIZE}" height="${QUADRAT_SIZE}"`,
        `         viewBox="0 0 ${QUADRAT_SIZE} ${QUADRAT_SIZE}">`,
        `      <g transform="${transform}" fill="currentColor">`,
        `        ${innerPaths}`,
        `      </g>`,
        `    </svg>`,
        `  </g>`,
      ].join("\n");
    })
    .join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    `     xmlns:xlink="http://www.w3.org/1999/xlink"`,
    `     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"`,
    `     xmlns:cc="http://creativecommons.org/ns#"`,
    `     xmlns:dc="http://purl.org/dc/elements/1.1/"`,
    `     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"`,
    `     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"`,
    `     ${sizeAttr} viewBox="${viewBoxAttr}">`,
    glyphElements,
    `</svg>`,
  ].join("\n");
}

/**
 * Strips the outer <svg> wrapper from raw SVG content and returns just
 * the inner elements (paths, groups, etc.) as a string.
 */
function extractSvgInner(rawSvg: string): string {
  // Remove XML declaration and DOCTYPE if present
  const clean = rawSvg
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "");
  // Extract content between <svg ...> and </svg>
  const match = clean.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  return match ? match[1].trim() : clean.trim();
}

/**
 * Sanitizes inner SVG content by removing namespaced attributes and metadata
 * that can cause XML parsing errors if the namespaces aren't defined.
 */
function sanitizeSvgInner(inner: string): string {
  return inner
    .replace(/<metadata>[\s\S]*?<\/metadata>/gi, "")
    .replace(/\s(inkscape|sodipodi|rdf|dc|cc):[a-z-]+="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sfill="[^"]*"/gi, "")
    .replace(/\sstroke="[^"]*"/gi, "");
}

/**
 * Extracts the intrinsic viewBox from raw SVG content.
 */
function extractViewBox(
  rawSvg: string,
): { width: number; height: number } | null {
  const m = rawSvg.match(
    /viewBox\s*=\s*"\s*[-\d.]+\s+[-\d.]+\s+([-\d.]+)\s+([-\d.]+)\s*"/i,
  );
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return null;
  return { width: w, height: h };
}

/**
 * A simple placeholder SVG for glyphs that haven't loaded yet.
 * Shows a dashed box with the Gardiner code as text.
 */
function placeholderSvg(code: string): string {
  return `
    <rect x="50" y="50" width="1700" height="1700" fill="none"
          stroke="#888" stroke-width="40" stroke-dasharray="100 60" rx="80"/>
    <text x="900" y="980" text-anchor="middle" dominant-baseline="central"
          font-family="monospace" font-size="400" fill="#888">${code}</text>
  `;
}
