import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";
import type {
  GlyphState,
  GardinerCode,
  RotationDeg,
  ExportSize,
} from "@/types";
import { cycleRotation } from "@/lib/transform";
import { composeSvg } from "@/lib/svgComposer";
import { buildHtmlPayload, writeToClipboard } from "@/lib/clipboard";

// ─── State Shape ──────────────────────────────

interface EditorState {
  /** Ordered list of glyphs on the canvas */
  glyphs: GlyphState[];

  /** Raw SVG strings keyed by Gardiner code (loaded on demand) */
  svgCache: Map<string, string>;

  /** Currently active glyph instance IDs */
  selectedIds: Set<string>;

  /** Whether the toolbar is visible */
  toolbarVisible: boolean;
}

// ─── Actions Shape ───────────────────────────

interface EditorActions {
  // ── Canvas mutations ──
  addGlyph: (code: GardinerCode) => void;
  removeGlyph: (instanceId: string) => void;
  reorderGlyph: (instanceId: string, newPosition: number) => void;
  clearCanvas: () => void;

  // ── Selection ──
  selectGlyph: (instanceId: string, multi?: boolean) => void;
  deselectAll: () => void;

  // ── Transform (operate on selected glyphs) ──
  rotateSelected: (step?: 90 | -90) => void;
  setRotationSelected: (deg: RotationDeg) => void;
  flipSelectedH: () => void;
  flipSelectedV: () => void;
  scaleSelected: (factor: number) => void;
  resetTransformSelected: () => void;

  // ── Asset cache ──
  cacheSvg: (code: GardinerCode, content: string) => void;

  // ── Clipboard ──
  copySelected: (size?: ExportSize) => Promise<void>;
  pasteGlyphs: (codes: GardinerCode[]) => void;
}

// ─── Store ───────────────────────────────────

export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ── Initial State ──
        glyphs: [],
        svgCache: new Map(),
        selectedIds: new Set(),
        toolbarVisible: false,

        // ── Canvas mutations ──

        addGlyph: (code) =>
          set((state) => {
            const position = state.glyphs.length;
            state.glyphs.push({
              instanceId: uuidv4(),
              gardinerCode: code.toUpperCase(),
              rotation: 0,
              scale: 1,
              flipX: false,
              flipY: false,
              selected: false,
              position,
            });
          }),

        removeGlyph: (instanceId) =>
          set((state) => {
            state.glyphs = state.glyphs
              .filter((g: GlyphState) => g.instanceId !== instanceId)
              .map((g: GlyphState, i: number) => ({ ...g, position: i })); // reindex
            state.selectedIds.delete(instanceId);
          }),

        reorderGlyph: (instanceId, newPosition) =>
          set((state) => {
            const idx = state.glyphs.findIndex(
              (g: GlyphState) => g.instanceId === instanceId,
            );
            if (idx === -1) return;
            const [glyph] = state.glyphs.splice(idx, 1);
            state.glyphs.splice(newPosition, 0, glyph);
            state.glyphs.forEach((g: GlyphState, i: number) => {
              g.position = i;
            });
          }),

        clearCanvas: () =>
          set((state) => {
            state.glyphs = [];
            state.selectedIds = new Set();
            state.toolbarVisible = false;
          }),

        // ── Selection ──

        selectGlyph: (instanceId, multi = false) =>
          set((state) => {
            if (!multi) {
              state.glyphs.forEach((g: GlyphState) => {
                g.selected = false;
              });
              state.selectedIds = new Set();
            }
            const glyph = state.glyphs.find(
              (g: GlyphState) => g.instanceId === instanceId,
            );
            if (glyph) {
              glyph.selected = true;
              state.selectedIds.add(instanceId);
            }
            state.toolbarVisible = state.selectedIds.size > 0;
          }),

        deselectAll: () =>
          set((state) => {
            state.glyphs.forEach((g: GlyphState) => {
              g.selected = false;
            });
            state.selectedIds = new Set();
            state.toolbarVisible = false;
          }),

        // ── Transforms ──

        rotateSelected: (step = 90) =>
          set((state) => {
            for (const g of state.glyphs) {
              if (g.selected) g.rotation = cycleRotation(g.rotation, step);
            }
          }),

        setRotationSelected: (deg) =>
          set((state) => {
            for (const g of state.glyphs) {
              if (g.selected) g.rotation = deg;
            }
          }),

        flipSelectedH: () =>
          set((state) => {
            for (const g of state.glyphs) {
              if (g.selected) g.flipX = !g.flipX;
            }
          }),

        flipSelectedV: () =>
          set((state) => {
            for (const g of state.glyphs) {
              if (g.selected) g.flipY = !g.flipY;
            }
          }),

        scaleSelected: (factor) =>
          set((state) => {
            for (const g of state.glyphs) {
              if (g.selected)
                g.scale = Math.max(0.1, Math.min(4, g.scale * factor));
            }
          }),

        resetTransformSelected: () =>
          set((state) => {
            for (const g of state.glyphs) {
              if (g.selected) {
                g.rotation = 0;
                g.scale = 1;
                g.flipX = false;
                g.flipY = false;
              }
            }
          }),

        // ── Asset cache ──

        cacheSvg: (code, content) =>
          set((state) => {
            state.svgCache.set(code.toUpperCase(), content);
          }),

        // ── Clipboard ──

        copySelected: async (size = "large") => {
          const { glyphs, svgCache } = get();
          const selected = glyphs.filter((g) => g.selected);
          if (selected.length === 0) return;

          const svgMarkup = composeSvg(selected, svgCache, size);
          const plainText = selected.map((g) => g.gardinerCode).join(" ");
          const htmlPayload = buildHtmlPayload(svgMarkup, size);

          await writeToClipboard({
            "text/plain": plainText,
            "text/html": htmlPayload,
            "image/svg+xml": svgMarkup,
          });
        },

        pasteGlyphs: (codes) => {
          const { addGlyph } = get();
          codes.forEach((code) => addGlyph(code));
        },
      })),
    ),
    { name: "HieroglyphicEditor" },
  ),
);

// ─── Derived selectors (use outside store for memoization) ───

export const selectSelectedGlyphs = (s: EditorState) =>
  s.glyphs.filter((g) => g.selected);

export const selectGlyphCount = (s: EditorState) => s.glyphs.length;

export const selectHasSelection = (s: EditorState) => s.selectedIds.size > 0;
