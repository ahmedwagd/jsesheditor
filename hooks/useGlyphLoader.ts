"use client";

import { useEffect, useCallback } from "react";
import { loadGlyph } from "@/lib/glyphRegistry";
import { useEditorStore } from "@/store/useEditorStore";
import type { GardinerCode } from "@/types";

/**
 * Loads SVG content for an array of Gardiner codes into the store's cache.
 * Safe to call concurrently — deduplicates via the registry's internal cache.
 */
export function useGlyphLoader(codes: GardinerCode[]) {
  const cacheSvg = useEditorStore((s) => s.cacheSvg);
  const svgCache = useEditorStore((s) => s.svgCache);

  const loadMissing = useCallback(
    async (pending: GardinerCode[]) => {
      const missing = pending.filter((c) => !svgCache.has(c.toUpperCase()));
      await Promise.all(
        missing.map(async (code) => {
          const entry = await loadGlyph(code);
          if (entry) cacheSvg(entry.code, entry.svgContent);
        }),
      );
    },
    [cacheSvg, svgCache],
  );

  useEffect(() => {
    if (codes.length > 0) loadMissing(codes);
  }, [codes.join(","), loadMissing]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Returns the cached SVG string for a single code, or null if not yet loaded.
 */
export function useCachedSvg(code: GardinerCode): string | null {
  return useEditorStore((s) => s.svgCache.get(code.toUpperCase()) ?? null);
}
