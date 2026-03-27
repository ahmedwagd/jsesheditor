"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { selectHasSelection, useEditorStore } from "@/store/useEditorStore";
import type { ExportSize, RotationDeg } from "@/types";
import {
  FlipHorizontal,
  FlipVertical,
  RotateCcw as Reset,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";

export function Toolbar() {
  const hasSelection = useEditorStore(selectHasSelection);
  const selectedIds = useEditorStore((s) => s.selectedIds);

  const {
    rotateSelected,
    flipSelectedH,
    flipSelectedV,
    removeGlyph,
    deselectAll,
    copySelected,
    resetTransformSelected,
    setRotationSelected,
  } = useEditorStore();

  const handleDelete = () => {
    const ids = [...selectedIds];
    deselectAll();
    ids.forEach((id) => removeGlyph(id));
  };

  if (!hasSelection) return null;

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg shadow-xl">
        {/* Rotation controls */}
        <ToolbarGroup label="Rotate">
          <ToolbarButton
            icon={<RotateCcw size={15} />}
            tooltip="Rotate 90° CCW (Shift+R)"
            onClick={() => rotateSelected(-90)}
          />
          <ToolbarButton
            icon={<RotateCw size={15} />}
            tooltip="Rotate 90° CW (R)"
            onClick={() => rotateSelected(90)}
          />
          <Select
            onValueChange={(v) => setRotationSelected(Number(v) as RotationDeg)}
          >
            <SelectTrigger className="h-7 w-16 text-xs bg-stone-800 border-stone-700">
              <SelectValue placeholder="°" />
            </SelectTrigger>
            <SelectContent className="bg-stone-900 border-stone-700">
              {([0, 90, 180, 270] as RotationDeg[]).map((d) => (
                <SelectItem key={d} value={String(d)} className="text-xs">
                  {d}°
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ToolbarGroup>

        <Divider />

        {/* Flip controls */}
        <ToolbarGroup label="Flip">
          <ToolbarButton
            icon={<FlipHorizontal size={15} />}
            tooltip="Flip horizontal (H)"
            onClick={flipSelectedH}
          />
          <ToolbarButton
            icon={<FlipVertical size={15} />}
            tooltip="Flip vertical (V)"
            onClick={flipSelectedV}
          />
        </ToolbarGroup>

        <Divider />

        {/* Scale controls */}
        <ToolbarGroup label="Scale">
          <ToolbarButton
            tooltip="Scale down (–10%)"
            onClick={() => {
              /* TODO: implement scaleSelected */
            }}
          >
            <span className="text-xs font-mono">−</span>
          </ToolbarButton>
          <ScaleDisplay />
          <ToolbarButton
            tooltip="Scale up (+10%)"
            onClick={() => {
              /* TODO: implement scaleSelected */
            }}
          >
            <span className="text-xs font-mono">+</span>
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Copy preset */}
        <ToolbarGroup label="Copy">
          {(["small", "large"] as ExportSize[]).map((size) => (
            <ToolbarButton
              key={size}
              tooltip={`Copy as ${size} SVG (${size === "large" ? "800px" : "200px"})`}
              onClick={() => copySelected(size)}
            >
              <span className="text-xs font-mono uppercase tracking-widest">
                {size[0]}
              </span>
            </ToolbarButton>
          ))}
        </ToolbarGroup>

        <Divider />

        {/* Reset / Delete */}
        <ToolbarButton
          icon={<Reset size={15} />}
          tooltip="Reset transforms (0)"
          onClick={resetTransformSelected}
          variant="ghost"
        />
        <ToolbarButton
          icon={<Trash2 size={15} />}
          tooltip="Delete selected (Delete)"
          onClick={handleDelete}
          variant="destructive"
        />
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────

function ToolbarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-stone-700 mx-1" aria-hidden />;
}

/** Shows average scale of selected glyphs */
function ScaleDisplay() {
  const glyphs = useEditorStore((s) => s.glyphs);
  const selected = glyphs.filter((g) => g.selected);
  const avg =
    selected.length > 0
      ? selected.reduce((sum, g) => sum + g.scale, 0) / selected.length
      : 1;
  return (
    <span className="text-[10px] font-mono text-stone-400 w-10 text-center tabular-nums">
      {Math.round(avg * 100)}%
    </span>
  );
}

interface ToolbarButtonProps {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  variant?: "ghost" | "destructive";
}

function ToolbarButton({
  icon,
  children,
  tooltip,
  onClick,
  variant = "ghost",
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon"
            variant={variant === "destructive" ? "destructive" : "ghost"}
            className="h-7 w-7 text-stone-300 hover:text-white hover:bg-stone-700"
            onClick={onClick}
            aria-label={tooltip}
          />
        }
      >
        {icon ?? children}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-stone-800 text-stone-200 border-stone-700 text-xs"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
