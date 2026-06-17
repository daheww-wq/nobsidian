'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { useSearchStore } from '@/store/searchStore';

export function LinkedNotesList() {
  const { activePath } = useEditorStore();
  const { index } = useSearchStore();
  const router = useRouter();

  const [linked, setLinked] = useState<Array<{ path: string; title: string }>>([]);

  useEffect(() => {
    if (!activePath) {
      setLinked([]);
      return;
    }

    // 노트 이름 추출 (확장자 제외, 경로 마지막 세그먼트)
    const noteName = activePath.split('/').pop()?.replace(/\.md$/, '') ?? '';

    const refs = index.filter((item) => {
      if (item.path === activePath) return false;
      return item.body.includes(`[[${noteName}]]`) || item.title.includes(`[[${noteName}]]`);
    });

    setLinked(refs.map((r) => ({ path: r.path, title: r.title || r.path })));
  }, [activePath, index]);

  if (!activePath || linked.length === 0) return null;

  return (
    <div className="border-t border-gray-100 bg-white">
      <p className="px-3 py-2 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
        연결 노트 ({linked.length})
      </p>
      <div className="max-h-40 overflow-y-auto">
        {linked.slice(0, 50).map((n) => (
          <button
            key={n.path}
            onClick={() => router.push(`/workspace/${btoa(n.path)}`)}
            className="w-full px-3 py-1.5 text-left hover:bg-gray-50"
          >
            <p className="truncate text-xs text-green-700">📄 {n.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
