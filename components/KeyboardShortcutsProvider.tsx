"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/** Thin client wrapper that activates keyboard shortcuts across the app */
export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();
  return <>{children}</>;
}
