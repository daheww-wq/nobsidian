'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRepoStore } from '@/store/repoStore';
import { useAuthStore } from '@/store/authStore';
import type { GitHubRepo } from '@/types/github';

export default function SelectRepoPage() {
  const router = useRouter();
  const { fetchSession, user } = useAuthStore();
  const { setRepo } = useRepoStore();

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<number | null>(null);
  // 재시도 트리거: 값이 바뀌면 useEffect가 재실행
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/repos')
      .then((r) => {
        if (!r.ok) throw new Error('레포지토리 목록을 불러올 수 없습니다.');
        return r.json();
      })
      .then((data: { repos: GitHubRepo[] }) => {
        if (!cancelled) {
          setRepos(data.repos);
          setIsLoading(false); // ← async 콜백 내에서만 호출
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '알 수 없는 오류');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]); // retryCount 변경 시 재실행

  const handleSelect = async (repo: GitHubRepo) => {
    setSelecting(repo.id);
    try {
      // initialize .notegraph/config.json if not present
      await fetch('/api/repos/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo.full_name.split('/')[0],
          repo: repo.name,
          branch: repo.default_branch,
        }),
      });
    } catch {
      // non-fatal — proceed even if init fails
    }
    setRepo(repo);
    router.push('/workspace');
  };

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-lg font-bold text-gray-900">dohohon</span>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.login}</span>
            <button
              onClick={async () => {
                await useAuthStore.getState().logout();
                router.push('/login');
              }}
              className="text-sm text-gray-400 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">레포지토리 선택</h1>
        <p className="mb-6 text-sm text-gray-500">
          노트를 저장할 GitHub 레포지토리를 선택하세요. 선택한 레포에 .md 파일이 노트로 관리됩니다.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="레포지토리 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-4 pl-9 text-sm outline-none focus:border-gray-400 focus:ring-0"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setRetryCount((c) => c + 1);
              }}
              className="ml-2 underline"
            >
              다시 시도
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            {search ? '검색 결과가 없습니다.' : '레포지토리가 없습니다.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((repo) => (
              <li key={repo.id}>
                <button
                  onClick={() => handleSelect(repo)}
                  disabled={selecting !== null}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {repo.name}
                      </span>
                      {repo.private && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{repo.full_name}</p>
                  </div>
                  {selecting === repo.id ? (
                    <Spinner />
                  ) : (
                    <ChevronIcon className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="ml-3 h-4 w-4 shrink-0 animate-spin text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
