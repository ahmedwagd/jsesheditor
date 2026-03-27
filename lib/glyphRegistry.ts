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
const REGISTRY_SEED: Omit<GlyphRegistryEntry, "svgContent">[] = [
  {
    code: "A1",
    name: "Seated man",
    category: "A",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "D36",
    name: "Forearm",
    category: "D",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "G17",
    name: "Owl",
    category: "G",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "N35",
    name: "Water (ripple)",
    category: "N",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "O1",
    name: "House plan",
    category: "O",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "S29",
    name: "Folded cloth",
    category: "S",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "X1",
    name: "Bread loaf",
    category: "X",
    viewBox: { width: 1800, height: 1800 },
  },
  {
    code: "Z1",
    name: "Single stroke (numeric)",
    category: "Z",
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
