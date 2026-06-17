'use client';

import { useRef, useEffect } from 'react';

interface NoteTitleProps {
  value: string;
  onChange: (v: string) => void;
}

export function NoteTitle({ value, onChange }: NoteTitleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      className="mb-2 w-full font-bold text-gray-700 outline-none empty:before:text-gray-300 empty:before:content-['제목_없음']"
      style={{ fontSize: 'calc(var(--editor-font-size, 12px) + 1px)' }}
    />
  );
}
