import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GlyphState } from "@/types";

/**
 * Undo/redo history store.
 *
 * Analogy: think of this as a film strip.
 * - `past`    = frames already played (can rewind)
 * - `present` = the current frame on screen
 * - `future`  = frames we jumped back from (can fast-forward)
 *
 * We snapshot only the `glyphs` array — the minimal state needed
 * to reconstruct the canvas. SVG cache and selection are ephemeral.
 *
 * Usage:
 *   Call `pushSnapshot(glyphs)` after every meaningful mutation.
 *   Call `undo()` / `redo()` to navigate — both return the restored snapshot.
 */

const MAX_HISTORY = 50;

interface HistoryState {
  past: GlyphState[][];
  present: GlyphState[];
  future: GlyphState[][];
}

interface HistoryActions {
  pushSnapshot: (glyphs: GlyphState[]) => void;
  undo: () => GlyphState[] | null;
  redo: () => GlyphState[] | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState & HistoryActions>()(
  devtools(
    (set, get) => ({
      past: [],
      present: [],
      future: [],

      pushSnapshot: (glyphs) =>
        set((state) => {
          // Deep-clone the array so mutations don't corrupt history
          const snapshot = glyphs.map((g) => ({ ...g }));
          const past = [...state.past, state.present].slice(-MAX_HISTORY);
          return { past, present: snapshot, future: [] };
        }),

      undo: () => {
        const { past, present } = get();
        if (past.length === 0) return null;
        const previous = past[past.length - 1];
        set((state) => ({
          past: state.past.slice(0, -1),
          present: previous,
          future: [state.present, ...state.future],
        }));
        return previous;
      },

      redo: () => {
        const { future } = get();
        if (future.length === 0) return null;
        const next = future[0];
        set((state) => ({
          past: [...state.past, state.present],
          present: next,
          future: state.future.slice(1),
        }));
        return next;
      },

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,

      clear: () => set({ past: [], present: [], future: [] }),
    }),
    { name: "HieroglyphicHistory" },
  ),
);
