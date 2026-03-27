import type { GardinerCode, GlyphRegistryEntry } from "@/types";

/**
 * Static registry seed — extend this as you add SVG assets to /public/glyphs/.
 * The svgContent field is populated lazily via loadGlyph().
 *
 * Structure mirrors JSesh's Gardiner classification:
 *  A  — Man and his occupations
 *  D  — Parts of the human body
 *  G  — Birds
 *  ... etc.
 */

// "
// 2
// 20
// 200
// 3
// 30
// 300
// 4
// 40
// 400
// 5
// 50
// 500
// A1
// A1A
// A1B
// A1C
// A2
// A2A
// A3
// A3A
// A3B
// A4
// A4A
// A4B
// A4C
// A4D
// A5
// A5A
// A5B
// A6
// A6A
// A6B
// A6C
// A6D
// A6E
// A6F
// A6G
// A6h
// A6I
// A6J
// A6K
// A6L
// A7
// A7A
// A8
// A8A
// A9
// A9A
// A9B
// A9C
// "
const REGISTRY_SEED: Omit<GlyphRegistryEntry, "svgContent">[] = [
  {
    code: "A1",
    name: "Seated man",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A1A",
    name: "Forearm",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A1B",
    name: "Owl",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A1C",
    name: "Water (ripple)",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A2",
    name: "House plan",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A2A",
    name: "Folded cloth",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A3A",
    name: "Bread loaf",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A3B",
    name: "Single stroke (numeric)",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A4",
    name: "House plan",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A4A",
    name: "Folded cloth",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A4B",
    name: "Single stroke (numeric)",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A4C",
    name: "Single stroke (numeric)",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "A4D",
    name: "Single stroke (numeric)",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
];

/** In-memory cache: code → loaded entry */
const cache = new Map<GardinerCode, GlyphRegistryEntry>();

/**
 * Loads an SVG asset from /public/glyphs/<code>.svg and caches it.
 * Returns null if the asset doesn't exist or fails to load.
 */
export async function loadGlyph(
  code: GardinerCode,
): Promise<GlyphRegistryEntry | null> {
  const normalized = code.toUpperCase();

  if (cache.has(normalized)) {
    return cache.get(normalized)!;
  }

  const seed = REGISTRY_SEED.find((s) => s.code === normalized);
  if (!seed) return null;

  try {
    const res = await fetch(`/glyphs/${normalized}.svg`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const svgContent = await res.text();
    const entry: GlyphRegistryEntry = { ...seed, svgContent };
    cache.set(normalized, entry);
    return entry;
  } catch (err) {
    console.warn(`[glyphRegistry] Failed to load glyph ${normalized}:`, err);
    return null;
  }
}

/**
 * Resolves a list of Gardiner codes to registry entries.
 * Unknown codes are silently filtered out.
 */
export async function resolveGlyphs(
  codes: GardinerCode[],
): Promise<GlyphRegistryEntry[]> {
  const results = await Promise.all(codes.map(loadGlyph));
  return results.filter((r): r is GlyphRegistryEntry => r !== null);
}

/**
 * Returns all known codes from the seed (registered, not necessarily loaded).
 */
export function getAllKnownCodes(): GardinerCode[] {
  return REGISTRY_SEED.map((s) => s.code);
}

/**
 * Returns known codes grouped by Gardiner category letter.
 */
export function getCodesByCategory(): Map<string, GardinerCode[]> {
  const map = new Map<string, GardinerCode[]>();
  for (const seed of REGISTRY_SEED) {
    const existing = map.get(seed.category) ?? [];
    map.set(seed.category, [...existing, seed.code]);
  }
  return map;
}
