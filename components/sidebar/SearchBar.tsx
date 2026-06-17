'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchStore } from '@/store/searchStore';

export function SearchBar() {
  const { query, setQuery, setActive, clearQuery } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearQuery();
      setActive(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative px-2 py-1.5">
      <Search
        size={11}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="검색..."
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setActive(true)}
        onBlur={() => {
          if (!query) setActive(false);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pr-6 pl-7 text-xs outline-none focus:border-green-400 focus:bg-white focus:ring-0"
      />
      {query && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            clearQuery();
          }}
          className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
