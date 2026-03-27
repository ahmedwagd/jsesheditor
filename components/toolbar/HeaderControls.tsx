"use client";

import { useEditorStore, selectGlyphCount } from "@/store/useEditorStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { Button } from "@/components/ui/button";
import { Trash2, Undo2, Redo2 } from "lucide-react";

export function HeaderControls() {
  const { clearCanvas, glyphs, selectGlyph, deselectAll, selectedIds } =
    useEditorStore();
  const glyphCount = useEditorStore(selectGlyphCount);
  const allSelected = selectedIds.size === glyphCount && glyphCount > 0;

  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  const handleUndo = () => {
    const snapshot = undo();
    if (snapshot) {
      useEditorStore.setState({ glyphs: snapshot, selectedIds: new Set() });
    }
  };

  const handleRedo = () => {
    const snapshot = redo();
    if (snapshot) {
      useEditorStore.setState({ glyphs: snapshot, selectedIds: new Set() });
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAll();
    } else {
      glyphs.forEach((g, i) => selectGlyph(g.instanceId, i > 0));
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Undo / Redo — always visible */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleUndo}
        disabled={!canUndo()}
        className="h-7 w-7 p-0 text-stone-500 hover:text-stone-200 disabled:opacity-25"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={13} />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleRedo}
        disabled={!canRedo()}
        className="h-7 w-7 p-0 text-stone-500 hover:text-stone-200 disabled:opacity-25"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={13} />
      </Button>

      {/* Canvas-level controls — only when glyphs exist */}
      {glyphCount > 0 && (
        <>
          <div className="w-px h-4 bg-stone-800 mx-0.5" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSelectAll}
            className="h-7 text-xs text-stone-500 hover:text-stone-200 font-mono px-2"
          >
            {allSelected ? "Deselect" : "Select all"}
            <span className="ml-1 text-stone-700">({glyphCount})</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={clearCanvas}
            className="h-7 w-7 p-0 text-stone-600 hover:text-red-400 hover:bg-red-950/30"
            title="Clear canvas"
          >
            <Trash2 size={13} />
          </Button>
        </>
      )}
    </div>
  );
}
