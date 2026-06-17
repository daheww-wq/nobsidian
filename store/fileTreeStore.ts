import { create } from 'zustand';
import type { FileTreeNode } from '@/types/note';

interface FileTreeState {
  tree: FileTreeNode[];
  expandedPaths: Set<string>;
  activeNotePath: string | null;
  isLoading: boolean;

  setTree: (tree: FileTreeNode[]) => void;
  setLoading: (v: boolean) => void;
  toggleExpand: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  setActiveNote: (path: string | null) => void;

  // Optimistic mutations
  addNode: (node: FileTreeNode, parentPath: string | null) => void;
  removeNode: (path: string) => void;
  renameNode: (oldPath: string, newName: string) => void;
  moveNode: (path: string, newParentPath: string | null) => void;
}

function insertNode(
  tree: FileTreeNode[],
  parentPath: string | null,
  node: FileTreeNode
): FileTreeNode[] {
  if (!parentPath) return [...tree, node];
  return tree.map((n) => {
    if (n.path === parentPath && n.children) {
      return { ...n, children: [...n.children, node] };
    }
    if (n.children) {
      return { ...n, children: insertNode(n.children, parentPath, node) };
    }
    return n;
  });
}

function removeNode(tree: FileTreeNode[], path: string): FileTreeNode[] {
  return tree
    .filter((n) => n.path !== path)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, path) } : n));
}

function renameInTree(tree: FileTreeNode[], oldPath: string, newName: string): FileTreeNode[] {
  return tree.map((n) => {
    if (n.path === oldPath) {
      const parts = oldPath.split('/');
      parts[parts.length - 1] = newName;
      const newPath = parts.join('/');
      return { ...n, name: newName, path: newPath };
    }
    if (n.children) {
      return { ...n, children: renameInTree(n.children, oldPath, newName) };
    }
    return n;
  });
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  tree: [],
  expandedPaths: new Set(),
  activeNotePath: null,
  isLoading: false,

  setTree: (tree) => set({ tree }),
  setLoading: (v) => set({ isLoading: v }),

  toggleExpand: (path) =>
    set((s) => {
      const next = new Set(s.expandedPaths);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedPaths: next };
    }),

  setExpanded: (path, expanded) =>
    set((s) => {
      const next = new Set(s.expandedPaths);
      if (expanded) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return { expandedPaths: next };
    }),

  setActiveNote: (path) => set({ activeNotePath: path }),

  addNode: (node, parentPath) => set((s) => ({ tree: insertNode(s.tree, parentPath, node) })),

  removeNode: (path) => set((s) => ({ tree: removeNode(s.tree, path) })),

  renameNode: (oldPath, newName) => set((s) => ({ tree: renameInTree(s.tree, oldPath, newName) })),

  moveNode: () => {
    // full tree reload after move — handled by caller
  },
}));
