"use client";

import React, { useCallback } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { DraggableGlyph } from "./DraggableGlyph";
import { useGlyphLoader } from "@/hooks/useGlyphLoader";

/**
 * The primary editing surface.
 *
 * Layout model: horizontal flex flow — each glyph occupies one quadrat cell.
 * Clicking a glyph selects it; Ctrl/Cmd+Click adds to selection.
 * Clicking the empty canvas background deselects all.
 *
 * The canvas itself is NOT an SVG element — it's a regular div that hosts
 * individual GlyphRenderer SVG elements. The SVG-first invariant is about
 * the *export* path, not the editing canvas display.
 */
export function EditorCanvas() {
  const glyphs = useEditorStore((s) => s.glyphs);
  const selectGlyph = useEditorStore((s) => s.selectGlyph);
  const deselectAll = useEditorStore((s) => s.deselectAll);

  // Preload SVG assets for all glyphs currently on canvas
  const allCodes = glyphs.map((g) => g.gardinerCode);
  useGlyphLoader(allCodes);

  const handleGlyphClick = useCallback(
    (instanceId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectGlyph(instanceId, e.ctrlKey || e.metaKey);
    },
    [selectGlyph],
  );

  return (
    <div
      className="flex-1 min-h-0 overflow-auto bg-stone-950 rounded-lg border border-stone-800"
      onClick={deselectAll}
      aria-label="Editor canvas — click to deselect"
    >
      <div className="min-h-full flex items-center p-8">
        {glyphs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-row items-center gap-3 flex-wrap">
            {glyphs
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((glyph) => (
                <DraggableGlyph
                  key={glyph.instanceId}
                  glyph={glyph}
                  displaySize={140}
                  onClick={handleGlyphClick}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-stone-600 select-none pointer-events-none">
      <div className="text-5xl mb-4 opacity-30">𓂀</div>
      <p className="text-sm font-mono">Add glyphs from the library panel</p>
      <p className="text-xs mt-1 opacity-60">
        or type Gardiner codes separated by spaces
      </p>
    </div>
  );
}
