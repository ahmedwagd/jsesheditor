"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { readFromClipboard } from "@/lib/clipboard";

/**
 * Global keyboard shortcut handler for the editor.
 *
 * Shortcuts:
 *  R           — Rotate selected 90° CW
 *  Shift+R     — Rotate selected 90° CCW
 *  H           — Flip horizontal
 *  V           — Flip vertical
 *  Delete/Backspace — Remove selected glyph(s)
 *  Escape      — Deselect all
 *  Ctrl/Cmd+C  — Copy selected (large)
 *  Ctrl/Cmd+V  — Paste from clipboard
 *  Ctrl/Cmd+A  — Select all
 *  0           — Reset transform
 */
export function useKeyboardShortcuts() {
  const {
    rotateSelected,
    flipSelectedH,
    flipSelectedV,
    deselectAll,
    copySelected,
    pasteGlyphs,
    selectedIds,
    glyphs,
    selectGlyph,
    removeGlyph,
    resetTransformSelected,
  } = useEditorStore();

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const ctrl = e.ctrlKey || e.metaKey;

      switch (true) {
        case e.key === "r" && !e.shiftKey && !ctrl:
          e.preventDefault();
          rotateSelected(90);
          break;

        case e.key === "r" && e.shiftKey && !ctrl:
          e.preventDefault();
          rotateSelected(-90);
          break;

        case e.key === "h" && !ctrl:
          e.preventDefault();
          flipSelectedH();
          break;

        case e.key === "v" && !ctrl:
          e.preventDefault();
          flipSelectedV();
          break;

        case (e.key === "Delete" || e.key === "Backspace") && !ctrl: {
          e.preventDefault();
          const toRemove = [...selectedIds];
          deselectAll();
          toRemove.forEach((id) => removeGlyph(id));
          break;
        }

        case e.key === "Escape":
          deselectAll();
          break;

        case e.key === "0" && !ctrl:
          e.preventDefault();
          resetTransformSelected();
          break;

        case e.key === "c" && ctrl:
          e.preventDefault();
          await copySelected("large");
          break;

        case e.key === "v" && ctrl: {
          e.preventDefault();
          const result = await readFromClipboard();
          if (result.type === "gardinerIds") pasteGlyphs(result.ids);
          break;
        }

        case e.key === "a" && ctrl: {
          e.preventDefault();
          glyphs.forEach((g, i) => selectGlyph(g.instanceId, i > 0));
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    rotateSelected,
    flipSelectedH,
    flipSelectedV,
    deselectAll,
    copySelected,
    pasteGlyphs,
    selectedIds,
    glyphs,
    selectGlyph,
    removeGlyph,
    resetTransformSelected,
  ]);
}
