'use client';

import { useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { toast } from '@/components/ui/Toast';
import { extractBacklinks } from '@/lib/markdown/backlinks';

const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 180;
const MAX_WIDTH = 600;

export function DetailPanel() {
  const {
    isDetailPanelOpen,
    toggleDetailPanel,
    frontmatter,
    markdownBody,
    activePath,
    updateFrontmatter,
  } = useEditorStore();
  const { tree } = useFileTreeStore();

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [tagInput, setTagInput] = useState('');
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

  const backlinks = markdownBody ? extractBacklinks(markdownBody) : [];
  const allNotePaths = flattenNotePaths(tree);

  const handleSummarize = useCallback(async () => {
    if (!frontmatter || !markdownBody.trim()) {
      toast({ type: 'info', message: '노트 내용이 없습니다.' });
      return;
    }
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdownBody }),
      });
      if (!res.ok) throw new Error();
      const { summary } = (await res.json()) as { summary: string };
      updateFrontmatter({ summary });
      toast({ type: 'success', message: '요약이 생성되었습니다.' });
    } catch {
      toast({ type: 'error', message: 'AI 요약에 실패했습니다.' });
    } finally {
      setIsSummarizing(false);
    }
  }, [frontmatter, markdownBody, updateFrontmatter]);

  const handleAutoTag = useCallback(async () => {
    if (!frontmatter || !markdownBody.trim()) return;
    try {
      const res = await fetch('/api/ai/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdownBody, existingTags: frontmatter.tags }),
      });
      if (!res.ok) throw new Error();
      const { tags } = (await res.json()) as { tags: string[] };
      updateFrontmatter({ tags });
      toast({ type: 'success', message: '태그가 생성되었습니다.' });
    } catch {
      toast({ type: 'error', message: 'AI 태그 생성에 실패했습니다.' });
    }
  }, [frontmatter, markdownBody, updateFrontmatter]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || !frontmatter) return;
    if (frontmatter.tags.includes(tag)) return;
    updateFrontmatter({ tags: [...frontmatter.tags, tag] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!frontmatter) return;
    updateFrontmatter({ tags: frontmatter.tags.filter((t) => t !== tag) });
  };

  return (
    <div
      className="overflow-hidden border-l border-gray-200 bg-white"
      style={{
        width: isDetailPanelOpen ? `${width}px` : '0',
        transition: isResizing ? 'none' : 'width 0.2s',
      }}
    >
      <div className="relative flex h-full flex-col" style={{ width: `${width}px` }}>
        {/* Drag handle */}
        {isDetailPanelOpen && (
          <div
            className="absolute top-0 left-0 z-10 h-full w-1 cursor-col-resize hover:bg-green-300"
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold">요약 & 태그</h2>
          <button onClick={toggleDetailPanel} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-4 text-sm">
            {/* AI Summary */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  AI 요약
                </h3>
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-50"
                >
                  {isSummarizing ? '생성 중...' : '갱신'}
                </button>
              </div>
              {frontmatter?.summary ? (
                <p className="text-xs leading-relaxed text-gray-600">{frontmatter.summary}</p>
              ) : (
                <p className="text-xs text-gray-300">요약 없음</p>
              )}
            </section>

            <hr className="border-gray-100" />

            {/* Tags */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  태그
                </h3>
                <button
                  onClick={handleAutoTag}
                  className="text-[10px] text-gray-400 hover:text-gray-700"
                >
                  AI 자동
                </button>
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                {frontmatter?.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="태그 추가..."
                  className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
                />
                <button
                  onClick={addTag}
                  className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Backlinks */}
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                연결 노트 ({backlinks.length})
              </h3>
              {backlinks.length === 0 ? (
                <p className="text-xs text-gray-300">백링크 없음</p>
              ) : (
                <ul className="space-y-1">
                  {backlinks.map((bl, i) => {
                    const exists = allNotePaths.some(
                      (p) =>
                        p.replace(/\.md$/, '') === bl ||
                        p.replace(/\.md$/, '').split('/').pop() === bl
                    );
                    return (
                      <li
                        key={i}
                        className={`text-xs ${exists ? 'text-blue-600' : 'text-red-400'}`}
                      >
                        {!exists && <span title="깨진 링크">⚠ </span>}[[{bl}]]
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <hr className="border-gray-100" />

            {/* File info */}
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                파일 정보
              </h3>
              <dl className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <dt>경로</dt>
                  <dd className="max-w-[150px] truncate text-right text-gray-700">{activePath}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>생성</dt>
                  <dd>
                    {frontmatter?.created
                      ? new Date(frontmatter.created).toLocaleDateString('ko-KR')
                      : '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>수정</dt>
                  <dd>
                    {frontmatter?.updated
                      ? new Date(frontmatter.updated).toLocaleDateString('ko-KR')
                      : '-'}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function flattenNotePaths(tree: import('@/types/note').FileTreeNode[]): string[] {
  const paths: string[] = [];
  for (const n of tree) {
    if (n.type === 'file') paths.push(n.path);
    else if (n.children) paths.push(...flattenNotePaths(n.children));
  }
  return paths;
}
