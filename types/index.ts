// ─────────────────────────────────────────────
// Core domain types for the Hieroglyphic Editor
// 1800×1800 base coordinate system (JSesh-compatible)
// ─────────────────────────────────────────────

export type GardinerCode = string; // e.g. "G17", "A1", "D36"

export type RotationDeg = 0 | 90 | 180 | 270;

export type FlipAxis = "H" | "V";

export type ExportSize = "small" | "large";

/** The canonical size of a single quadrat in internal coordinates */
export const QUADRAT_SIZE = 1800 as const;

// ─── Single Glyph State ───────────────────────

export interface GlyphState {
  /** Unique instance ID (uuid) — distinct from Gardiner code */
  instanceId: string;

  /** Gardiner sign code that maps to an SVG asset, e.g. "G17" */
  gardinerCode: GardinerCode;

  /** Rotation in degrees, clockwise */
  rotation: RotationDeg;

  /** Uniform scale factor (1.0 = 100%) */
  scale: number;

  /** Horizontal flip applied */
  flipX: boolean;

  /** Vertical flip applied */
  flipY: boolean;

  /** Whether this glyph is currently selected */
  selected: boolean;

  /**
   * Position within the canvas sequence (0-indexed).
   * The layout engine uses this for horizontal flow ordering.
   */
  position: number;
}

// ─── Glyph Registry Entry ────────────────────

export interface GlyphRegistryEntry {
  code: GardinerCode;
  /** Unicode name / description */
  name: string;
  /** Category from Gardiner list (A–Aa) */
  category: string;
  /** Raw SVG string — loaded at runtime or bundled */
  svgContent: string;
  /** Intrinsic viewBox dimensions from the SVG file */
  viewBox: { width: number; height: number };
}

// ─── Transform Parameters ────────────────────

export interface TransformParams {
  rotation: RotationDeg;
  flipX: boolean;
  flipY: boolean;
  scale: number;
}

/** Stringified SVG transform attribute value */
export type SvgTransformString = string;

// ─── Clipboard Payload ───────────────────────

/**
 * Multi-MIME clipboard payload.
 * "text/html" is the primary vector carrier for Word/Google Docs.
 * "image/svg+xml" is used where the browser Clipboard API supports it.
 * "text/plain" is the Gardiner ID fallback (e.g. "G17 A1 D36").
 */
export interface ClipboardPayload {
  "text/plain": string;
  "text/html": string;
  "image/svg+xml"?: string;
}

// ─── Export Config ───────────────────────────

export const EXPORT_SIZES: Record<
  ExportSize,
  { width: number; height: number }
> = {
  small: { width: 200, height: 200 },
  large: { width: 800, height: 800 },
};

// ─── Canvas / Layout ─────────────────────────

export interface CanvasLayout {
  /** Horizontal gap between glyphs in internal units */
  gap: number;
  /** Padding around the full composition */
  padding: number;
}

export const DEFAULT_LAYOUT: CanvasLayout = {
  gap: 100,
  padding: 200,
};
