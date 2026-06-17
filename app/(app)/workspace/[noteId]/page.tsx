'use client';

import { useEffect, use } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useRepoStore } from '@/store/repoStore';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { parseFrontmatter } from '@/lib/markdown/frontmatter';
import { useSearchStore } from '@/store/searchStore';
import { Editor } from '@/components/editor/Editor';
import { HistoryPanel } from '@/components/editor/HistoryPanel';
import { EditorSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { useState } from 'react';

export default function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const { setActiveNote, isHistoryOpen } = useEditorStore();
  const { selectedRepo } = useRepoStore();
  const { setActiveNote: setTreeActive } = useFileTreeStore();
  const { addToIndex } = useSearchStore();
  const [isLoading, setIsLoading] = useState(true);

  const path = (() => {
    try {
      return atob(noteId);
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!path || !selectedRepo) return;

    const owner = selectedRepo.full_name.split('/')[0];
    setIsLoading(true);

    fetch(
      `/api/notes/get?owner=${owner}&repo=${selectedRepo.name}&path=${encodeURIComponent(path)}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: { content: string; sha: string }) => {
        const { frontmatter, body } = parseFrontmatter(data.content);
        setActiveNote(path, data.sha, frontmatter, body);
        setTreeActive(path);
        addToIndex({
          path,
          title: frontmatter.title || path.split('/').pop()?.replace(/\.md$/, '') || path,
          tags: frontmatter.tags ?? [],
          body,
          updatedAt: frontmatter.updated ?? '',
        });
      })
      .catch(() => {
        toast({
          type: 'error',
          message: '노트를 불러올 수 없습니다.',
          action: { label: '재시도', onClick: () => window.location.reload() },
        });
      })
      .finally(() => setIsLoading(false));
  }, [path, selectedRepo]);

  if (isLoading) return <EditorSkeleton />;

  return (
    <>
      <Editor />
      {isHistoryOpen && <HistoryPanel />}
    </>
  );
}
