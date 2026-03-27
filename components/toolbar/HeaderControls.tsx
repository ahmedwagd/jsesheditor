"use client";
import { useEditorStore } from "@/store/useEditorStore";
import { Button } from "@/components/ui/button";

export function HeaderControls() {
  const { clearCanvas, glyphs, selectGlyph } = useEditorStore();
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-stone-500 hover:text-white"
        onClick={() =>
          glyphs.forEach((g, i) => selectGlyph(g.instanceId, i > 0))
        }
      >
        Select all
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-stone-500 hover:text-red-400"
        onClick={clearCanvas}
      >
        Clear
      </Button>
    </div>
  );
}
