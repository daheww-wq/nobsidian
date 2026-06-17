import { create } from 'zustand';
import type { NoteFrontmatter } from '@/types/note';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'offline';

interface EditorState {
  activePath: string | null;
  activeSha: string | null;
  frontmatter: NoteFrontmatter | null;
  markdownBody: string;
  saveStatus: SaveStatus;
  isDetailPanelOpen: boolean;
  isHistoryOpen: boolean;

  setActiveNote: (path: string, sha: string, fm: NoteFrontmatter, body: string) => void;
  setMarkdownBody: (body: string) => void;
  setSaveStatus: (s: SaveStatus) => void;
  setSha: (sha: string) => void;
  updateFrontmatter: (fm: Partial<NoteFrontmatter>) => void;
  toggleDetailPanel: () => void;
  toggleHistory: () => void;
  clearEditor: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activePath: null,
  activeSha: null,
  frontmatter: null,
  markdownBody: '',
  saveStatus: 'saved',
  isDetailPanelOpen: false,
  isHistoryOpen: false,

  setActiveNote: (path, sha, fm, body) =>
    set({
      activePath: path,
      activeSha: sha,
      frontmatter: fm,
      markdownBody: body,
      saveStatus: 'saved',
    }),

  setMarkdownBody: (body) => set({ markdownBody: body, saveStatus: 'unsaved' }),

  setSaveStatus: (s) => set({ saveStatus: s }),

  setSha: (sha) => set({ activeSha: sha }),

  updateFrontmatter: (fm) =>
    set((s) => ({
      frontmatter: s.frontmatter ? { ...s.frontmatter, ...fm } : null,
    })),

  toggleDetailPanel: () => set((s) => ({ isDetailPanelOpen: !s.isDetailPanelOpen })),

  toggleHistory: () => set((s) => ({ isHistoryOpen: !s.isHistoryOpen })),

  clearEditor: () =>
    set({
      activePath: null,
      activeSha: null,
      frontmatter: null,
      markdownBody: '',
      saveStatus: 'saved',
    }),
}));
