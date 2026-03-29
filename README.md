# Hieroglyphic SVG Editor

A web-based, SVG-first hieroglyphic composition tool inspired by [JSesh](http://jsesh.qenherkhopeshef.org/).

## Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Framework     | Next.js 16 (App Router)         |
| UI components | shadcn/ui + Tailwind CSS        |
| State         | Zustand 5 with Immer middleware |
| Language      | TypeScript (strict)             |

---

## Architecture Decisions

### 1. The 1800×1800 Coordinate System

Every glyph SVG asset uses a fixed internal coordinate space of **1800×1800 units** — the same base used by JSesh for its sign library. This is established via the `viewBox="0 0 1800 1800"` attribute on each asset.

**Why 1800?**

- It's large enough to encode fine path detail without fractional coordinates.
- It's divisible by common scale factors (2, 3, 4, 6, 9, 10) making alignment math clean.
- It matches existing JSesh-compatible SVG exports, so community glyph libraries drop in without conversion.

The constant is defined once in `src/types/glyph.ts` as `QUADRAT_SIZE = 1800` and referenced everywhere else — never hardcoded.

**Layout math:**

When composing N glyphs into a single export SVG:

```
totalWidth  = N × 1800 + (N - 1) × gap + 2 × padding
totalHeight = 1800 + 2 × padding
```

The outer `<svg>` carries a `viewBox` of these computed dimensions and an explicit `width`/`height` for the export size preset. The `viewBox` is what guarantees infinite scalability — the `width`/`height` is just a hint.

---

### 2. SVG-First Transforms (not CSS)

All rotations, flips, and scales are applied via the SVG `transform` attribute on an inner `<g>` element — **never via CSS `transform`**.

```xml
<!-- Correct: baked into SVG markup -->
<g transform="rotate(90, 900, 900) translate(1800, 0) scale(-1, 1)">
  ...paths...
</g>

<!-- Wrong: lost when SVG is copied/exported -->
<g style="transform: rotate(90deg) scaleX(-1)">
  ...paths...
</g>
```

**Why this matters:** When a user copies the SVG and pastes it into Word or Google Docs, the application reads the raw SVG markup. CSS styles from the original page are stripped. If transforms are CSS-only, the pasted glyph appears untransformed. SVG `transform` attributes survive the round-trip.

The utility `buildSvgTransform()` in `src/lib/transform.ts` handles the coordinate math for rotation (around the quadrat center) and flipping (translate-scale idiom).

---

### 3. Multi-MIME Clipboard Strategy

When copying glyphs, we write three MIME types simultaneously using `navigator.clipboard.write()`:

| MIME type       | Purpose                      | Consumer                                                                                   |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| `text/html`     | `<div><svg ...></svg></div>` | **Word, Google Docs** — these read HTML clipboard and embed the `<svg>` as a vector object |
| `image/svg+xml` | Raw SVG string               | Figma, Inkscape, vector-aware apps (Chromium 113+ only)                                    |
| `text/plain`    | `"G17 A1 D36"`               | Plain text editors, re-paste into the editor itself                                        |

**Why `text/html` is primary:**

Microsoft Word and Google Docs do not read `image/svg+xml` from the clipboard. They _do_ parse `text/html` and will embed any `<svg>` element found inside it as a native vector object — scalable to any size without rasterization. Wrapping in a `<div>` is required as the top-level container for some parsers.

**Export size presets:**

The `small` (200×200) and `large` (800×800) presets only change the `width` and `height` attributes on the root `<svg>` tag. The `viewBox` is identical in both — this is what guarantees the glyph scales without blurring regardless of which preset is used.

```xml
<!-- Small -->
<svg width="200" height="200" viewBox="0 0 4000 2200">

<!-- Large -->
<svg width="800" height="800" viewBox="0 0 4000 2200">
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Root editor layout
│   ├── layout.tsx            # HTML shell + fonts
│   └── globals.css           # Tailwind + shadcn CSS variables
│
├── components/
│   ├── canvas/
│   │   ├── EditorCanvas.tsx  # Main composition surface
│   │   ├── StatusBar.tsx       # Status bar with undo/redo buttons
│   │   └── GlyphRenderer.tsx # Single glyph SVG renderer
│   ├── toolbar/
│   │   ├── Toolbar.tsx       # Contextual transform controls
│   │   └── CodeInput.tsx     # Gardiner code text input
│   ├── ui/                   # shadcn base components
│   ├── GlyphLibrary.tsx  # Browse + insert glyphs
│   └── KeyboardShortcutsProvider.tsx
│
├── store/
│   └── useEditorStore.ts     # Zustand store (single source of truth)
│
├── lib/
│   ├── transform.ts          # SVG transform math utilities
│   ├── clipboard.ts          # Multi-MIME clipboard read/write
│   ├── svgComposer.ts        # Assembles export SVG from state
│   ├── glyphRegistry.ts      # Code → SVG asset mapping + loader
│   └── utils.ts              # cn() helper
│
├── hooks/
│   ├── useGlyphLoader.ts     # Async SVG fetch + cache population
│   └── useKeyboardShortcuts.ts
│
└── types/
    └── glyph.ts              # All domain TypeScript types
```

---

## Getting Started

```bash
npm install
npm run dev
```

Add SVG glyph assets to `public/glyphs/` named by Gardiner code (e.g. `G17.svg`, `A1.svg`). Each file should be a standard SVG with `viewBox="0 0 1800 1800"`.

Register new codes in `src/lib/glyphRegistry.ts` under `REGISTRY_SEED`.

---

## Keyboard Shortcuts

| Key                    | Action                       |
| ---------------------- | ---------------------------- |
| `R`                    | Rotate 90° CW                |
| `Shift+R`              | Rotate 90° CCW               |
| `H`                    | Flip horizontal              |
| `V`                    | Flip vertical                |
| `0`                    | Reset all transforms         |
| `Delete` / `Backspace` | Remove selected              |
| `Escape`               | Deselect all                 |
| `Ctrl/Cmd+C`           | Copy selected (large preset) |
| `Ctrl/Cmd+V`           | Paste Gardiner codes         |
| `Ctrl/Cmd+A`           | Select all                   |

---

## Validation Checklist

- [ ] Paste output SVG into Google Docs → resize to 2× → no blurring
- [ ] Paste output SVG into Word → resize to 2× → no blurring
- [ ] Copy with `image/svg+xml` → paste into Figma → editable paths
- [ ] `text/plain` fallback contains space-separated Gardiner codes
- [ ] Re-paste plain text back into editor → glyphs re-inserted
- [ ] Rotated/flipped glyphs remain transformed after paste into Word
