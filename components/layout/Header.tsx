'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRepoStore } from '@/store/repoStore';
import { useEditorStore } from '@/store/editorStore';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { selectedRepo, clearRepo } = useRepoStore();
  const { isDetailPanelOpen, toggleDetailPanel, isGraphPanelOpen, toggleGraphPanel } =
    useEditorStore();

  const handleLogout = async () => {
    await logout();
    clearRepo();
    router.push('/login');
  };

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <Link href="/workspace" className="text-base font-bold text-gray-900">
          dohohon
        </Link>
        {selectedRepo && (
          <>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => router.push('/select-repo')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {selectedRepo.name}
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Detail panel toggle (v2) */}
        <button
          onClick={toggleDetailPanel}
          title="패널 열기/닫기"
          className={`rounded-md px-2 py-1.5 text-sm ${isDetailPanelOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          ☰
        </button>

        {/* Graph panel toggle */}
        <button
          onClick={toggleGraphPanel}
          title="지식 그래프"
          className={`rounded-md px-2 py-1.5 text-sm ${isGraphPanelOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          ⬡
        </button>

        {user && (
          <div className="flex items-center gap-2 border-l border-gray-200 pl-2">
            <span className="text-xs text-gray-500">{user.login}</span>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-700">
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
