'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/editorStore';
import { useRepoStore } from '@/store/repoStore';
import { serializeFrontmatter } from '@/lib/markdown/frontmatter';
import { SaveQueue } from '@/lib/editor/saveQueue';
import { noteCache } from '@/lib/cache/noteCache';
import { toast } from '@/components/ui/Toast';
import { EditorSkeleton } from '@/components/ui/Skeleton';
import { NoteTitle } from './NoteTitle';
import { EditorToolbar } from './EditorToolbar';

const BlockNoteEditor = dynamic(() => import('./BlockNoteEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const AUTOSAVE_DELAY = 2000;

export function Editor() {
  const {
    activePath,
    frontmatter,
    markdownBody,
    saveStatus,
    restoreKey,
    setMarkdownBody,
    setSaveStatus,
    setSha,
    updateFrontmatter,
  } = useEditorStore();
  const { selectedRepo } = useRepoStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const saveQueueRef = useRef<SaveQueue | null>(null);
  // triggerSave self-reference를 ref로 보관 — useCallback 내부에서 자기 자신을 참조할 때
  // no-use-before-define 가능성 없이 최신 버전을 클로저로 캡처
  const triggerSaveRef = useRef<((isManual: boolean) => Promise<void>) | null>(null);

  const forceOverwrite = useCallback(
    async (content: string) => {
      if (!activePath || !selectedRepo) return;
      const owner = selectedRepo.full_name.split('/')[0];
      const res = await fetch('/api/notes/force-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: selectedRepo.name, path: activePath, content }),
      });
      if (res.ok) {
        const data = (await res.json()) as { sha: string };
        setSha(data.sha);
        setSaveStatus('saved');
      }
    },
    [activePath, selectedRepo, setSha, setSaveStatus]
  );

  const triggerSave = useCallback(
    async (isManual: boolean) => {
      if (!activePath || !frontmatter || !selectedRepo) return;
      // 항상 스토어에서 최신 SHA 읽기 — 클로저 stale 방지
      const sha = useEditorStore.getState().activeSha;
      if (!sha) return;
      if (!isOnline) {
        setSaveStatus('offline');
        return;
      }
      if (!isManual && !markdownBody.trim() && !frontmatter.title.trim()) return;

      setSaveStatus('saving');
      const content = serializeFrontmatter(frontmatter, markdownBody);
      const owner = selectedRepo.full_name.split('/')[0];

      if (isManual) saveQueueRef.current?.flush();

      try {
        const res = await fetch('/api/notes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner,
            repo: selectedRepo.name,
            path: activePath,
            content,
            sha,
            isManual,
          }),
        });

        if (res.status === 409) {
          setSaveStatus('error');
          toast({
            type: 'error',
            message: '외부에서 파일이 변경되었습니다.',
            action: { label: '덮어쓰기', onClick: () => forceOverwrite(content) },
          });
          return;
        }
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { sha: string };
        setSha(data.sha);
        setSaveStatus('saved');
        noteCache.set(activePath, content, data.sha);
      } catch {
        setSaveStatus('error');
        // triggerSaveRef를 통해 최신 triggerSave 참조 — 재시도 버튼 복원
        toast({
          type: 'error',
          message: '저장에 실패했습니다.',
          action: { label: '재시도', onClick: () => triggerSaveRef.current?.(isManual) },
        });
      }
    },
    [
      activePath,
      frontmatter,
      markdownBody,
      selectedRepo,
      isOnline,
      forceOverwrite,
      setSaveStatus,
      setSha,
    ]
  );

  // triggerSaveRef를 항상 최신 triggerSave로 유지
  useEffect(() => {
    triggerSaveRef.current = triggerSave;
  }, [triggerSave]);

  // 배치 저장 큐 초기화
  useEffect(() => {
    const queue = new SaveQueue(async (items) => {
      const last = items[items.length - 1];
      if (last) await triggerSave(last.isManual);
    });
    saveQueueRef.current = queue;
    return () => queue.destroy();
  }, [activePath, triggerSave]);

  // Online/offline 감지
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      if (saveStatus === 'offline') triggerSave(false);
    };
    const onOffline = () => {
      setIsOnline(false);
      setSaveStatus('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [saveStatus, triggerSave, setSaveStatus]);

  // beforeunload 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  // Cmd/Ctrl+S 수동 저장
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        triggerSave(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerSave]);

  const handleBodyChange = useCallback(
    (markdown: string) => {
      setMarkdownBody(markdown);
      setSaveStatus('unsaved');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (activePath) saveQueueRef.current?.push(activePath, markdown, false);
        triggerSave(false);
      }, AUTOSAVE_DELAY);
    },
    [setMarkdownBody, setSaveStatus, triggerSave, activePath]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      updateFrontmatter({ title });
      setSaveStatus('unsaved');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => triggerSave(false), AUTOSAVE_DELAY);
    },
    [updateFrontmatter, setSaveStatus, triggerSave]
  );

  if (!activePath || !frontmatter) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
        <span className="mb-3 text-4xl">📝</span>
        <p className="text-sm">노트를 선택하거나 새로 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EditorToolbar onSave={() => triggerSave(true)} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[960px] px-20 py-12">
          <NoteTitle value={frontmatter.title} onChange={handleTitleChange} />
          <BlockNoteEditor
            key={restoreKey}
            initialMarkdown={markdownBody}
            onChange={handleBodyChange}
            notePath={activePath}
          />
        </div>
      </div>
    </div>
  );
}
