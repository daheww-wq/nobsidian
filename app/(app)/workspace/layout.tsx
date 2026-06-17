'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRepoStore } from '@/store/repoStore';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { useEditorStore } from '@/store/editorStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { DetailPanel } from '@/components/detail/DetailPanel';
import { GraphPanel } from '@/components/graph/GraphPanel';
import { ToastContainer } from '@/components/ui/Toast';
import { useSearchStore } from '@/store/searchStore';
import { noteCache } from '@/lib/cache/noteCache';
import type { FileTreeNode } from '@/types/note';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { fetchSession } = useAuthStore();
  const { selectedRepo } = useRepoStore();
  const { setTree, setLoading } = useFileTreeStore();
  const { addToIndex, clearIndex } = useSearchStore();
  const { clearEditor } = useEditorStore();
  // 최초 마운트는 초기화 건너뜀 — 레포 변경 시에만 초기화
  const prevRepoRef = useRef<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!selectedRepo) {
      router.push('/select-repo');
      return;
    }

    // 레포가 바뀌었을 때만 에디터·캐시·검색 초기화
    const repoKey = selectedRepo.full_name;
    if (prevRepoRef.current !== null && prevRepoRef.current !== repoKey) {
      clearEditor();
      clearIndex();
      noteCache.clearAll();
    }
    prevRepoRef.current = repoKey;

    const owner = selectedRepo.full_name.split('/')[0];
    setLoading(true);

    fetch(
      `/api/repos/tree?owner=${owner}&repo=${selectedRepo.name}&branch=${selectedRepo.default_branch}`
    )
      .then((r) => r.json())
      .then((d: { tree: FileTreeNode[] }) => {
        setTree(d.tree);
        function indexFiles(nodes: FileTreeNode[]) {
          for (const n of nodes) {
            if (n.type === 'file') {
              const title = n.name.replace(/\.md$/, '');
              addToIndex({ path: n.path, title, tags: [], body: '', updatedAt: '' });
            } else if (n.children) {
              indexFiles(n.children);
            }
          }
        }
        indexFiles(d.tree);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedRepo, router, setLoading, setTree, addToIndex, clearEditor, clearIndex]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main data-testid="editor-area" className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
        <GraphPanel />
        <DetailPanel />
      </div>
      <StatusBar />
      <ToastContainer />
    </div>
  );
}
