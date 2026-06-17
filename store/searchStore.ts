import { create } from 'zustand';
import type { SearchIndexItem, SearchResult } from '@/lib/markdown/search';
import { searchIndex } from '@/lib/markdown/search';

interface SearchStore {
  index: SearchIndexItem[];
  query: string;
  results: SearchResult[];
  sortBy: 'relevance' | 'date';
  isActive: boolean; // 검색창 포커스 여부

  addToIndex: (item: SearchIndexItem) => void;
  setQuery: (q: string) => void;
  setSortBy: (s: 'relevance' | 'date') => void;
  setActive: (v: boolean) => void;
  clearQuery: () => void;
  clearIndex: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  index: [],
  query: '',
  results: [],
  sortBy: 'relevance',
  isActive: false,

  addToIndex: (item) => {
    set((s) => {
      const existing = s.index.findIndex((i) => i.path === item.path);
      const next =
        existing >= 0 ? s.index.map((i, idx) => (idx === existing ? item : i)) : [...s.index, item];
      return { index: next, results: searchIndex(next, s.query, s.sortBy) };
    });
  },

  setQuery: (q) => {
    set((s) => ({
      query: q,
      results: searchIndex(s.index, q, s.sortBy),
    }));
  },

  setSortBy: (sortBy) => {
    set((s) => ({
      sortBy,
      results: searchIndex(s.index, s.query, sortBy),
    }));
  },

  setActive: (v) => set({ isActive: v }),

  clearQuery: () => {
    set((s) => ({ query: '', results: searchIndex(s.index, '', s.sortBy) }));
  },

  clearIndex: () => set({ index: [], query: '', results: [], isActive: false }),
}));
