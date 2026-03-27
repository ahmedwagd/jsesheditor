import { EditorCanvas } from "@/components/canvas/EditorCanvas";
import { PreviewPanel } from "@/components/canvas/PreviewPanel";
import { GlyphLibrary } from "@/components/GlyphLibrary";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CodeInput } from "@/components/toolbar/CodeInput";
import { HeaderControls } from "@/components/toolbar/HeaderControls";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function EditorPage() {
  return (
    <TooltipProvider>
      <KeyboardShortcutsProvider>
        <div className="h-screen flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between px-4 py-2 border-b border-stone-800 bg-stone-950 shrink-0">
            <div className="flex items-center gap-3">
              <span
                className="text-lg font-mono tracking-tight text-amber-400"
                aria-hidden
              >
                𓏲
              </span>
              <div>
                <span className="text-sm font-semibold tracking-wide text-stone-200">
                  Hieroglyphic Editor
                </span>
                <span className="text-[10px] text-stone-600 font-mono ml-2">
                  SVG-first · 1800&times;1800
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CodeInput />
              <HeaderControls />
            </div>
          </header>

          {/* Contextual toolbar — only visible when glyphs are selected */}
          <div className="flex justify-center px-4 py-1.5 border-b border-stone-800 min-h-[44px] items-center shrink-0">
            <Toolbar />
          </div>

          {/* Main layout: library | canvas | preview */}
          <div className="flex flex-1 min-h-0">
            <GlyphLibrary />

            <main className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
              <EditorCanvas />
              <footer className="mt-2 text-[10px] font-mono text-stone-700 text-right shrink-0">
                R rotate · H flip-H · V flip-V · Del delete · Ctrl+C copy ·
                Ctrl+V paste · 0 reset · drag to reorder
              </footer>
            </main>

            <PreviewPanel />
          </div>
        </div>
      </KeyboardShortcutsProvider>
    </TooltipProvider>
  );
}
