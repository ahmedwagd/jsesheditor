"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { getAllKnownCodes } from "@/lib/glyphRegistry";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Parses a space-separated string of Gardiner codes and inserts recognized ones.
 * Example input: "A1 D36 G17"
 */
export function CodeInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addGlyph = useEditorStore((s) => s.addGlyph);

  const handleInsert = () => {
    setError(null);
    const knownCodes = new Set(getAllKnownCodes());
    const tokens = value
      .trim()
      .split(/\s+/)
      .map((t) => t.toUpperCase());

    const valid = tokens.filter((t) => knownCodes.has(t));
    const invalid = tokens.filter((t) => !knownCodes.has(t));

    if (valid.length === 0) {
      setError(`Unknown code(s): ${invalid.join(", ")}`);
      return;
    }

    valid.forEach(addGlyph);
    setValue("");

    if (invalid.length > 0) {
      setError(`Skipped unknown: ${invalid.join(", ")}`);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleInsert()}
          placeholder="A1 D36 G17…"
          className="h-8 text-xs font-mono bg-stone-900 border-stone-700 text-stone-200 placeholder:text-stone-600"
        />
        <Button
          size="sm"
          onClick={handleInsert}
          className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-stone-950"
        >
          Insert
        </Button>
      </div>
      {error && (
        <p className="text-[10px] text-amber-400 font-mono px-1">{error}</p>
      )}
    </div>
  );
}
