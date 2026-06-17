'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEditorStore } from '@/store/editorStore';
import { useGraphData } from '@/lib/hooks/useGraphData';

const KnowledgeGraph = dynamic(
  () => import('@/components/graph/KnowledgeGraph').then((m) => m.KnowledgeGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-gray-400">
        그래프 로딩 중...
      </div>
    ),
  }
);

export function GraphPanel() {
  const { isGraphPanelOpen, toggleGraphPanel } = useEditorStore();
  const { graphData, isLoading } = useGraphData();

  return (
    <div
      className="overflow-hidden border-l border-gray-200 bg-white transition-all duration-200"
      style={{ width: isGraphPanelOpen ? '400px' : '0' }}
    >
      <div className="flex h-full w-[400px] flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold">지식 그래프</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/workspace/graph"
              className="text-xs text-gray-400 hover:text-gray-700"
              title="전체 화면으로 보기"
            >
              전체 보기 ↗
            </Link>
            <button onClick={toggleGraphPanel} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              데이터 로딩 중...
            </div>
          ) : !graphData || graphData.nodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
              <span className="text-2xl">⬡</span>
              <p className="text-xs">연결된 노트가 없습니다.</p>
            </div>
          ) : (
            <KnowledgeGraph data={graphData} />
          )}
        </div>
      </div>
    </div>
  );
}
