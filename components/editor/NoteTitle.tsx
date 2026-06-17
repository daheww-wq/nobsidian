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
      className="mb-4 min-h-[2.5rem] w-full text-3xl font-bold text-gray-900 outline-none empty:before:text-gray-300 empty:before:content-['제목_없음']"
    />
  );
}
