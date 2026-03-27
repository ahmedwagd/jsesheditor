"use client";

import React, { useRef, useState } from "react";
import type { GlyphState } from "@/types";
import { GlyphRenderer } from "./GlyphRenderer";
import { useEditorStore } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";

interface DraggableGlyphProps {
  glyph: GlyphState;
  displaySize?: number;
  onClick: (instanceId: string, e: React.MouseEvent) => void;
}

/**
 * Wraps GlyphRenderer with native HTML5 drag-and-drop reordering.
 *
 * We deliberately avoid heavy DnD libraries here. The native API is enough
 * for a 1D horizontal list:
 *  - dragstart  → store the dragged instance ID
 *  - dragover   → compute insertion index from mouse X vs rendered widths
 *  - drop       → call reorderGlyph() in the store
 *
 * A ghost "insertion line" appears between glyphs to show the drop target.
 */
export function DraggableGlyph({
  glyph,
  displaySize = 140,
  onClick,
}: DraggableGlyphProps) {
  const reorderGlyph = useEditorStore((s) => s.reorderGlyph);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState<"before" | "after" | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", glyph.instanceId);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    // Slight delay so the drag image renders before opacity kicks in
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragRef.current) return;
    const rect = dragRef.current.getBoundingClientRect();
    const half = rect.left + rect.width / 2;
    setIsDragOver(e.clientX < half ? "before" : "after");
  };

  const handleDragLeave = () => setIsDragOver(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId === glyph.instanceId) {
      setIsDragOver(null);
      return;
    }
    // Compute target position
    const targetPos =
      isDragOver === "before" ? glyph.position : glyph.position + 1;
    reorderGlyph(sourceId, targetPos);
    setIsDragOver(null);
  };

  return (
    <div
      ref={dragRef}
      className={cn(
        "relative flex items-center transition-all duration-100",
        isDragging && "opacity-40",
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator — before */}
      {isDragOver === "before" && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-amber-400 rounded-full z-10" />
      )}

      <GlyphRenderer
        glyph={glyph}
        displaySize={displaySize}
        onClick={onClick}
      />

      {/* Drop indicator — after */}
      {isDragOver === "after" && (
        <div className="absolute -right-2 top-0 bottom-0 w-1 bg-amber-400 rounded-full z-10" />
      )}

      {/* Drag handle cursor hint */}
      <div
        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 text-stone-600 cursor-grab"
        aria-hidden
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <circle cx="3" cy="3" r="1.2" fill="currentColor" />
          <circle cx="7" cy="3" r="1.2" fill="currentColor" />
          <circle cx="3" cy="7" r="1.2" fill="currentColor" />
          <circle cx="7" cy="7" r="1.2" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
