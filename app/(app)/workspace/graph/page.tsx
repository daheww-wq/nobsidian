'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGraphData } from '@/lib/hooks/useGraphData';

const KnowledgeGraph = dynamic(
  () => import('@/components/graph/KnowledgeGraph').then((m) => m.KnowledgeGraph),
  { ssr: false }
);

function GraphPageContent() {
  const searchParams = useSearchParams();
  const filterTag = searchParams.get('tag') ?? undefined;
  const focusNote = searchParams.get('note') ? atob(searchParams.get('note')!) : undefined;

  const { graphData, allTags, isLoading } = useGraphData();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        그래프 데이터 로딩 중...
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
        <span className="text-3xl">⬡</span>
        <p className="text-sm">노트가 없거나 연결된 노트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2">
          <Link
            href="/workspace/graph"
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${!filterTag ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            전체
          </Link>
          {allTags.map((tag) => (
            <Link
              key={tag}
              href={`/workspace/graph?tag=${encodeURIComponent(tag)}`}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${filterTag === tag ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex-1">
        <KnowledgeGraph data={graphData} focusNote={focusNote} filterTag={filterTag} />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-gray-400" />
          <span>백링크</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-gray-300" />
          <span>공유 태그</span>
        </div>
      </div>
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-gray-400">
          로딩 중...
        </div>
      }
    >
      <GraphPageContent />
    </Suspense>
  );
}
