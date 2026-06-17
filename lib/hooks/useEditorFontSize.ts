import { useState } from 'react';

const KEY = 'editor-font-size';
const DEFAULT = 13;
const MIN = 10;
const MAX = 20;

function readStored(): number {
  if (typeof window === 'undefined') return DEFAULT;
  const stored = localStorage.getItem(KEY);
  const n = Number(stored);
  return stored && !isNaN(n) && n >= MIN && n <= MAX ? n : DEFAULT;
}

export function useEditorFontSize() {
  const [fontSize, setFontSizeState] = useState<number>(readStored);

  const setFontSize = (size: number) => {
    const clamped = Math.max(MIN, Math.min(MAX, size));
    setFontSizeState(clamped);
    localStorage.setItem(KEY, String(clamped));
  };

  return {
    fontSize,
    increase: () => setFontSize(fontSize + 1),
    decrease: () => setFontSize(fontSize - 1),
  };
}
