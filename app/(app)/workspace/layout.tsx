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
import { ToastContainer } from '@/components/ui/Toast';
import { buildFileTree } from '@/lib/github/fileTree';
import type { GitHubTreeItem } from '@/types/github';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { fetchSession } = useAuthStore();
  const { selectedRepo } = useRepoStore();
  const { setTree, setLoading } = useFileTreeStore();

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
      .then((d: { tree: import('@/types/note').FileTreeNode[] }) => setTree(d.tree))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedRepo]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
        <DetailPanel />
      </div>
      <StatusBar />
      <ToastContainer />
    </div>
  );
}
