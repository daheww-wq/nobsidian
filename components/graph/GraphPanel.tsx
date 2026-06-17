'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useGraphData } from '@/lib/hooks/useGraphData';

const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 250;
const MAX_WIDTH = 700;

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
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, startWidthRef.current + (startXRef.current - ev.clientX))
        );
        setWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [width]
  );

  return (
    <div
      className="overflow-hidden border-l border-gray-200 bg-white"
      style={{
        width: isGraphPanelOpen ? `${width}px` : '0',
        transition: isResizing ? 'none' : 'width 0.2s',
      }}
    >
      <div className="relative flex h-full flex-col" style={{ width: `${width}px` }}>
        {/* Drag handle */}
        {isGraphPanelOpen && (
          <div
            className="absolute top-0 left-0 z-10 h-full w-1 cursor-col-resize hover:bg-green-300"
            onMouseDown={handleResizeMouseDown}
          />
        )}

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
              <X size={14} />
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
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
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
