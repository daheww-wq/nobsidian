'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRepoStore } from '@/store/repoStore';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { DetailPanel } from '@/components/detail/DetailPanel';
import { GraphPanel } from '@/components/graph/GraphPanel';
import { ToastContainer } from '@/components/ui/Toast';
import { useSearchStore } from '@/store/searchStore';
import type { FileTreeNode } from '@/types/note';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { fetchSession } = useAuthStore();
  const { selectedRepo } = useRepoStore();
  const { setTree, setLoading } = useFileTreeStore();
  const { addToIndex } = useSearchStore();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!selectedRepo) {
      router.push('/select-repo');
      return;
    }

    const owner = selectedRepo.full_name.split('/')[0];
    setLoading(true);

    fetch(
      `/api/repos/tree?owner=${owner}&repo=${selectedRepo.name}&branch=${selectedRepo.default_branch}`
    )
      .then((r) => r.json())
      .then((d: { tree: FileTreeNode[] }) => {
        setTree(d.tree);
        // 파일 경로 기반 기본 인덱스 (제목은 파일명, 본문은 나중에 채워짐)
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
  }, [selectedRepo, router, setLoading, setTree, addToIndex]);

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
