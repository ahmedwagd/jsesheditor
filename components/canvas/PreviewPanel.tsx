// PreviewPanel
"use client";

import { useMemo, useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { composeSvg } from "@/lib/svgComposer";
import type { ExportSize } from "@/types";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { buildHtmlPayload, writeToClipboard } from "@/lib/clipboard";

/**
 * Renders a live preview of the full composition as it would appear when exported.
 * The SVG here is the *exact* markup that would be written to the clipboard —
 * so what you see in this panel is literally what Word/Docs would receive.
 *
 * Updates are synchronous with the Zustand store — no debounce needed because
 * composeSvg() is a pure function over a small array.
 */
export function PreviewPanel() {
  const glyphs = useEditorStore((s) => s.glyphs);
  const svgCache = useEditorStore((s) => s.svgCache);
  const [exportSize, setExportSize] = useState<ExportSize>("large");
  const [copied, setCopied] = useState(false);

  const composedSvg = useMemo(
    () => (glyphs.length > 0 ? composeSvg(glyphs, svgCache, exportSize) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [glyphs, svgCache, exportSize],
  );

  const handleCopyAll = async () => {
    if (!composedSvg) return;
    const plainText = glyphs.map((g) => g.gardinerCode).join(" ");
    await writeToClipboard({
      "text/plain": plainText,
      "text/html": buildHtmlPayload(composedSvg, exportSize),
      "image/svg+xml": composedSvg,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!composedSvg) return;
    const blob = new Blob([composedSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hieroglyphs-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-64 flex flex-col border-l border-stone-800 bg-stone-950 shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-stone-800 flex items-center justify-between">
        <h2 className="text-xs font-mono text-stone-400 uppercase tracking-widest">
          Live Preview
        </h2>
        {/* Size toggle */}
        <div className="flex rounded overflow-hidden border border-stone-700">
          {(["small", "large"] as ExportSize[]).map((s) => (
            <button
              key={s}
              onClick={() => setExportSize(s)}
              className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${
                exportSize === s
                  ? "bg-amber-600 text-stone-950"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {s === "small" ? "S" : "L"}
            </button>
          ))}
        </div>
      </div>

      {/* SVG preview area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {composedSvg ? (
          <div
            className="w-full max-h-full overflow-hidden rounded border border-stone-800 bg-white"
            dangerouslySetInnerHTML={{ __html: composedSvg }}
            title="Export preview — this exact SVG is copied to clipboard"
          />
        ) : (
          <div className="text-center text-stone-700 select-none">
            <div className="text-3xl mb-2 opacity-20">□</div>
            <p className="text-[10px] font-mono">Canvas is empty</p>
          </div>
        )}
      </div>

      {/* SVG source code (collapsed) */}
      {composedSvg && (
        <details className="border-t border-stone-800 group">
          <summary className="px-3 py-2 text-[10px] font-mono text-stone-600 cursor-pointer hover:text-stone-400 select-none">
            SVG markup ▾
          </summary>
          <pre className="text-[9px] font-mono text-stone-600 px-3 pb-3 overflow-x-auto max-h-40 leading-relaxed">
            {composedSvg}
          </pre>
        </details>
      )}

      {/* Action bar */}
      <div className="p-3 border-t border-stone-800 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyAll}
          disabled={!composedSvg}
          className="flex-1 h-7 text-[10px] border-stone-700 text-stone-400 hover:text-white hover:border-amber-500"
        >
          <Copy size={11} className="mr-1" />
          {copied ? "Copied!" : "Copy all"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={!composedSvg}
          className="h-7 w-7 p-0 border-stone-700 text-stone-400 hover:text-white hover:border-amber-500"
          title="Download .svg"
        >
          <Download size={11} />
        </Button>
      </div>

      {/* Glyph code list */}
      {glyphs.length > 0 && (
        <div className="px-3 pb-3">
          <p className="text-[10px] font-mono text-stone-600 leading-relaxed break-all">
            {glyphs.map((g) => g.gardinerCode).join(" ")}
          </p>
        </div>
      )}
    </aside>
  );
}
