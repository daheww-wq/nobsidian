'use client';

import { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useRepoStore } from '@/store/repoStore';
import { toast } from '@/components/ui/Toast';
import { parseFrontmatter } from '@/lib/markdown/frontmatter';

interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return '방금 전';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  return d.toLocaleDateString('ko-KR');
}

function getSaveType(message: string) {
  if (message.startsWith('[autosave]')) return '자동저장';
  if (message.startsWith('[save]')) return '수동저장';
  if (message.startsWith('[restore]')) return '복원';
  return null;
}

export function HistoryPanel() {
  const { activePath, toggleHistory, activeSha } = useEditorStore();
  const { selectedRepo } = useRepoStore();
  const [commits, setCommits] = useState<Commit[]>([]);
  // 어떤 경로의 커밋을 로드했는지 추적 → 파생 로딩 상태 (set-state-in-effect 방지)
  const [commitsFor, setCommitsFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Commit | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const isLoading = activePath !== commitsFor;

  useEffect(() => {
    if (!activePath || !selectedRepo) return;
    const owner = selectedRepo.full_name.split('/')[0];
    let cancelled = false;

    fetch(
      `/api/notes/history?owner=${owner}&repo=${selectedRepo.name}&path=${encodeURIComponent(activePath)}`
    )
      .then((r) => r.json())
      .then((d: { commits: Commit[] }) => {
        if (cancelled) return;
        setCommits(d.commits);
        setCommitsFor(activePath); // ← setState in callback, not in effect body
      })
      .catch(() => {
        if (!cancelled) setCommitsFor(activePath); // 에러 시에도 로딩 해제
      });

    return () => {
      cancelled = true;
    };
  }, [activePath, selectedRepo]);

  const handleSelect = (commit: Commit) => {
    setSelected(commit);
    setPreview(`커밋: ${commit.message}\n시간: ${new Date(commit.date).toLocaleString('ko-KR')}`);
  };

  const handleRestore = async (commit: Commit) => {
    if (!activePath || !selectedRepo || !activeSha) return;
    if (!confirm(`이 버전으로 복원하시겠습니까?\n현재 내용도 이력에 저장됩니다.`)) return;

    const owner = selectedRepo.full_name.split('/')[0];
    try {
      const res = await fetch('/api/notes/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo: selectedRepo.name,
          path: activePath,
          commitSha: commit.sha,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { content: string; sha: string };
      const { frontmatter, body } = parseFrontmatter(data.content);
      useEditorStore.getState().setActiveNote(activePath, data.sha, frontmatter, body);
      toast({ type: 'success', message: '버전이 복원되었습니다.' });
      toggleHistory();
    } catch {
      toast({ type: 'error', message: '복원에 실패했습니다.' });
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[520px] flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold">수정 이력</h2>
        <button onClick={toggleHistory} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Commit list */}
        <div className="w-[200px] shrink-0 overflow-y-auto border-r border-gray-100">
          {isLoading ? (
            <div className="p-4 text-xs text-gray-400">로딩 중...</div>
          ) : commits.length === 0 ? (
            <div className="p-4 text-xs text-gray-400">저장 이력이 없습니다.</div>
          ) : (
            commits.map((c) => {
              const type = getSaveType(c.message);
              return (
                <button
                  key={c.sha}
                  onClick={() => handleSelect(c)}
                  className={`w-full border-b border-gray-50 px-3 py-2.5 text-left hover:bg-gray-50 ${selected?.sha === c.sha ? 'bg-green-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {type && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          type === '자동저장'
                            ? 'bg-gray-100 text-gray-500'
                            : type === '수동저장'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-green-50 text-green-600'
                        }`}
                      >
                        {type}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(c.date)}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Preview / restore */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="font-mono text-xs text-gray-400">{selected.sha.slice(0, 7)}</p>
                <p className="mt-1 text-xs text-gray-600">{selected.message}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {new Date(selected.date).toLocaleString('ko-KR')}
                </p>
                {preview && (
                  <pre className="mt-4 rounded bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-600">
                    {preview}
                  </pre>
                )}
              </div>
              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  onClick={() => handleRestore(selected)}
                  className="w-full rounded-lg bg-gray-900 py-2 text-sm text-white hover:bg-gray-700"
                >
                  이 버전으로 복원
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
              이력을 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
