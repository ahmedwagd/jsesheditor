"use client";

import { useState, useMemo } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { getAllKnownCodes, getCodesByCategory } from "@/lib/glyphRegistry";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function GlyphLibrary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const addGlyph = useEditorStore((s) => s.addGlyph);

  const byCategory = useMemo(() => getCodesByCategory(), []);
  const allCodes = useMemo(() => getAllKnownCodes(), []);

  const filtered = useMemo(() => {
    const query = search.toUpperCase().trim();
    const base = activeCategory
      ? (byCategory.get(activeCategory) ?? [])
      : allCodes;
    return query ? base.filter((c) => c.includes(query)) : base;
  }, [search, activeCategory, byCategory, allCodes]);

  return (
    <aside className="w-56 flex flex-col border-r border-stone-800 bg-stone-950">
      {/* Header */}
      <div className="p-3 border-b border-stone-800">
        <h2 className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-2">
          Glyph Library
        </h2>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code…"
          className="h-7 text-xs bg-stone-900 border-stone-700 text-stone-200 placeholder:text-stone-600"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-stone-800">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer text-[10px] h-5 px-1.5"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Badge>
        {[...byCategory.keys()].sort().map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="cursor-pointer text-[10px] h-5 px-1.5"
            onClick={() =>
              setActiveCategory(cat === activeCategory ? null : cat)
            }
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Glyph grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-3 gap-1.5 p-2">
          {filtered.map((code) => (
            <button
              key={code}
              onClick={() => addGlyph(code)}
              className="group flex flex-col items-center justify-center gap-0.5 p-1.5 rounded
                         bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-600
                         transition-all duration-100 cursor-pointer"
              title={`Insert ${code}`}
            >
              {/* Placeholder glyph preview — replaced with actual SVG when loaded */}
              <div className="w-8 h-8 flex items-center justify-center text-stone-500 group-hover:text-amber-400">
                <svg viewBox="0 0 1800 1800" width="32" height="32">
                  <rect
                    x="100"
                    y="100"
                    width="1600"
                    height="1600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="80"
                    rx="80"
                    strokeDasharray="200 100"
                  />
                </svg>
              </div>
              <span className="text-[9px] font-mono text-stone-500 group-hover:text-stone-300">
                {code}
              </span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-xs text-stone-600 py-8">
            No glyphs found
          </p>
        )}
      </ScrollArea>
    </aside>
  );
}
