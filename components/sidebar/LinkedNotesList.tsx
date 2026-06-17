'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { useSearchStore } from '@/store/searchStore';

export function LinkedNotesList() {
  const { activePath } = useEditorStore();
  const { index } = useSearchStore();
  const router = useRouter();

  // useState + useEffect 대신 useMemo로 파생값 계산 — set-state-in-effect 방지
  const linked = useMemo(() => {
    if (!activePath) return [];
    const noteName = activePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
    return index
      .filter(
        (item) =>
          item.path !== activePath &&
          (item.body.includes(`[[${noteName}]]`) || item.title.includes(`[[${noteName}]]`))
      )
      .slice(0, 50)
      .map((r) => ({ path: r.path, title: r.title || r.path }));
  }, [activePath, index]);

  if (!activePath || linked.length === 0) return null;

  return (
    <div className="border-t border-gray-100 bg-white">
      <p className="px-3 py-2 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
        연결 노트 ({linked.length})
      </p>
      <div className="max-h-40 overflow-y-auto">
        {linked.map((n) => (
          <button
            key={n.path}
            onClick={() => router.push(`/workspace/${btoa(n.path)}`)}
            className="w-full px-3 py-1 text-left hover:bg-gray-50"
          >
            <p className="truncate text-[10px] text-gray-600">{n.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
