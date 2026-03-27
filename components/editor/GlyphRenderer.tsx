"use client";

import React, { useMemo } from "react";
import type { GlyphState } from "@/types";
import { QUADRAT_SIZE } from "@/types";
import { buildSvgTransform } from "@/lib/transform";
import { useCachedSvg } from "@/hooks/useGlyphLoader";
import { cn } from "@/lib/utils";

interface GlyphRendererProps {
  glyph: GlyphState;
  /** Pixel size to render at (the SVG viewBox stays 1800×1800) */
  displaySize?: number;
  onClick?: (instanceId: string, e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Renders a single glyph as a self-contained inline SVG element.
 *
 * Key invariant: all visual transforms (rotation, flip, scale) are applied
 * via SVG `transform` attributes on an inner <g> element — not via CSS
 * `transform` on the wrapper div. This ensures the transform is preserved
 * when the SVG is serialized for clipboard/export.
 */
export const GlyphRenderer = React.memo(function GlyphRenderer({
  glyph,
  displaySize = 120,
  onClick,
  className,
}: GlyphRendererProps) {
  const svgContent = useCachedSvg(glyph.gardinerCode);

  const transform = useMemo(
    () =>
      buildSvgTransform({
        rotation: glyph.rotation,
        flipX: glyph.flipX,
        flipY: glyph.flipY,
        scale: glyph.scale,
      }),
    [glyph.rotation, glyph.flipX, glyph.flipY, glyph.scale],
  );

  const innerMarkup = svgContent
    ? extractSvgInner(svgContent)
    : placeholderMarkup(glyph.gardinerCode);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Glyph ${glyph.gardinerCode}${glyph.selected ? ", selected" : ""}`}
      aria-pressed={glyph.selected}
      onClick={(e) => onClick?.(glyph.instanceId, e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          onClick?.(glyph.instanceId, e as unknown as React.MouseEvent);
      }}
      className={cn(
        "relative cursor-pointer rounded-sm transition-all duration-150",
        "ring-2 ring-transparent hover:ring-amber-400/60",
        glyph.selected && "ring-amber-500 shadow-lg shadow-amber-500/20",
        className,
      )}
      style={{ width: displaySize, height: displaySize }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${QUADRAT_SIZE} ${QUADRAT_SIZE}`}
        width={displaySize}
        height={displaySize}
        aria-hidden="true"
      >
        <g
          transform={transform}
          dangerouslySetInnerHTML={{ __html: innerMarkup }}
        />
      </svg>

      {/* Selection indicator badge */}
      {glyph.selected && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
      )}
    </div>
  );
});

// ─── Helpers ─────────────────────────────────

function extractSvgInner(rawSvg: string): string {
  const match = rawSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  return match ? match[1].trim() : rawSvg.trim();
}

function placeholderMarkup(code: string): string {
  return `
    <rect x="60" y="60" width="1680" height="1680" fill="none"
          stroke="#6b7280" stroke-width="60" stroke-dasharray="120 80" rx="80"/>
    <text x="900" y="950" text-anchor="middle" dominant-baseline="central"
          font-family="monospace" font-size="380" fill="#6b7280">${code}</text>
  `;
}
