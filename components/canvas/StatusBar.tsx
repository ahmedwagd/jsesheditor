"use client";

import { useEditorStore } from "@/store/useEditorStore";

/**
 * Thin status bar at the bottom of the canvas area.
 * Shows contextual info: selection count, active transforms, keyboard hints.
 */
export function StatusBar() {
  const glyphs = useEditorStore((s) => s.glyphs);
  const selectedIds = useEditorStore((s) => s.selectedIds);

  const selected = glyphs.filter((g) => g.selected);
  const total = glyphs.length;

  const transformSummary =
    selected.length === 1
      ? (() => {
          const g = selected[0];
          const parts: string[] = [];
          if (g.rotation !== 0) parts.push(`${g.rotation}°`);
          if (g.flipX) parts.push("flip-H");
          if (g.flipY) parts.push("flip-V");
          if (g.scale !== 1) parts.push(`${Math.round(g.scale * 100)}%`);
          return parts.length > 0 ? parts.join(" · ") : "no transforms";
        })()
      : null;

  return (
    <footer className="flex items-center justify-between mt-2 shrink-0">
      <div className="text-[10px] font-mono text-stone-600">
        {total === 0 ? (
          <span>empty canvas</span>
        ) : selectedIds.size > 0 ? (
          <span>
            <span className="text-amber-500">{selectedIds.size}</span>
            <span> of {total} selected</span>
            {transformSummary && (
              <span className="text-stone-700 ml-2">· {transformSummary}</span>
            )}
          </span>
        ) : (
          <span>{total} glyph{total !== 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="text-[10px] font-mono text-stone-700">
        R rotate · H flip · Del delete · Ctrl+Z undo · drag to reorder
      </div>
    </footer>
  );
}
