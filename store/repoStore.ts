import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GitHubRepo } from '@/types/github';
import type { FileTreeNode } from '@/types/note';

interface RepoState {
  selectedRepo: GitHubRepo | null;
  fileTree: FileTreeNode[];
  setRepo: (repo: GitHubRepo) => void;
  setFileTree: (tree: FileTreeNode[]) => void;
  clearRepo: () => void;
}

export const useRepoStore = create<RepoState>()(
  persist(
    (set) => ({
      selectedRepo: null,
      fileTree: [],
      setRepo: (repo) => set({ selectedRepo: repo }),
      setFileTree: (tree) => set({ fileTree: tree }),
      clearRepo: () => set({ selectedRepo: null, fileTree: [] }),
    }),
    {
      name: 'dohohon-repo',
      partialize: (state) => ({ selectedRepo: state.selectedRepo }),
    }
  )
);
