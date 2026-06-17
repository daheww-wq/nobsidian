interface CachedNote {
  content: string;
  sha: string;
  loadedAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5분

const cache = new Map<string, CachedNote>();

export const noteCache = {
  get(path: string): CachedNote | null {
    const entry = cache.get(path);
    if (!entry) return null;
    if (Date.now() - entry.loadedAt > CACHE_TTL) {
      cache.delete(path);
      return null;
    }
    return entry;
  },

  set(path: string, content: string, sha: string) {
    cache.set(path, { content, sha, loadedAt: Date.now() });
  },

  updateSha(path: string, sha: string) {
    const entry = cache.get(path);
    if (entry) cache.set(path, { ...entry, sha });
  },

  invalidate(path: string) {
    cache.delete(path);
  },

  clearAll() {
    cache.clear();
  },
};
