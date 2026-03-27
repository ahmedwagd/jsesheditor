import type { ClipboardPayload, ExportSize } from "@/types";
import { EXPORT_SIZES } from "@/types";

/**
 * Writes a multi-MIME payload to the system clipboard.
 *
 * MIME priority order (why these three):
 *  1. "text/html"      — Primary. Word and Google Docs read this first and
 *                        will embed the <svg> as a vector object. This is the
 *                        trick that keeps glyphs razor-sharp at any zoom level.
 *  2. "image/svg+xml"  — Secondary. Supported in some browsers (Chromium 113+)
 *                        via the async Clipboard API. Allows pasting into
 *                        Figma, Inkscape, etc.
 *  3. "text/plain"     — Fallback. Emits space-separated Gardiner codes so
 *                        a plain paste at least re-identifies the glyphs.
 *
 * Analogy: we're handing over a folder with three copies of the same document —
 * a vector PDF, a native format, and a plain-text summary. The receiving app
 * picks whichever it can handle best.
 */
export async function writeToClipboard(
  payload: ClipboardPayload,
): Promise<void> {
  const items: Record<string, Blob> = {
    "text/plain": new Blob([payload["text/plain"]], { type: "text/plain" }),
    "text/html": new Blob([payload["text/html"]], { type: "text/html" }),
  };

  if (payload["image/svg+xml"]) {
    items["image/svg+xml"] = new Blob([payload["image/svg+xml"]], {
      type: "image/svg+xml",
    });
  }

  try {
    await navigator.clipboard.write([new ClipboardItem(items)]);
  } catch (err) {
    // Fallback: write plain text only if full clipboard API is unavailable
    await navigator.clipboard.writeText(payload["text/plain"]);
    console.warn(
      "[clipboard] Multi-MIME write failed, fell back to plain text:",
      err,
    );
  }
}

/**
 * Builds the `text/html` MIME body for a composed SVG.
 *
 * The outer <div> is intentional — some applications use the <div>
 * as the container boundary when parsing HTML clipboard content.
 * The SVG preserves its viewBox so paste targets can resize freely.
 */
export function buildHtmlPayload(svgMarkup: string, size: ExportSize): string {
  const { width, height } = EXPORT_SIZES[size];
  // Inject explicit width/height on the root <svg> tag while keeping viewBox
  const sized = svgMarkup.replace(
    /<svg/,
    `<svg width="${width}" height="${height}"`,
  );
  return `<div>${sized}</div>`;
}

/**
 * Reads clipboard text and returns:
 *  - { type: "gardinerIds", ids: string[] }  if it looks like space-separated codes
 *  - { type: "svgHtml", svg: string }         if it contains an <svg> element
 *  - { type: "unknown" }                      otherwise
 */
export async function readFromClipboard(): Promise<ClipboardReadResult> {
  const text = await navigator.clipboard.readText();

  // Check for embedded SVG
  if (text.includes("<svg")) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const svgEl = doc.querySelector("svg");
    if (svgEl) {
      return { type: "svgHtml", svg: svgEl.outerHTML };
    }
  }

  // Check for Gardiner-like IDs (e.g. "G17 A1 D36")
  const tokens = text.trim().split(/\s+/);
  const gardinerPattern = /^[A-Za-z]{1,2}\d+[a-z]?$/;
  if (tokens.length > 0 && tokens.every((t) => gardinerPattern.test(t))) {
    return { type: "gardinerIds", ids: tokens.map((t) => t.toUpperCase()) };
  }

  return { type: "unknown" };
}

export type ClipboardReadResult =
  | { type: "gardinerIds"; ids: string[] }
  | { type: "svgHtml"; svg: string }
  | { type: "unknown" };
