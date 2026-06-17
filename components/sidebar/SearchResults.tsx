'use client';

import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';

export function SearchResults() {
  const { results, query, sortBy, setSortBy } = useSearchStore();
  const router = useRouter();

  const handleClick = (path: string) => {
    router.push(`/workspace/${btoa(path)}`);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 정렬 토글 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1">
        <span className="text-[10px] text-gray-400">
          {query ? `${results.length}개 결과` : '최근 노트'}
        </span>
        <div className="flex gap-1">
          {(['relevance', 'date'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                sortBy === s ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {s === 'relevance' ? '관련도' : '날짜'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <p className="text-xs text-gray-400">&ldquo;{query}&rdquo; 결과 없음</p>
          </div>
        ) : (
          results.map((r) => (
            <button
              key={r.path}
              onClick={() => handleClick(r.path)}
              className="w-full border-b border-gray-50 px-3 py-2 text-left hover:bg-gray-50"
            >
              <p className="truncate text-xs font-medium text-gray-800">{highlight(r.title)}</p>
              {r.snippet && (
                <p className="mt-0.5 truncate text-[10px] text-gray-400">{r.snippet}</p>
              )}
              {r.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function highlight(text: string): string {
  return text;
}
