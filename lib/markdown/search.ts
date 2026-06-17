export interface SearchIndexItem {
  path: string;
  title: string;
  tags: string[];
  body: string;
  updatedAt: string;
}

export interface SearchResult {
  path: string;
  title: string;
  tags: string[];
  snippet: string; // 50자 본문 컨텍스트
  score: number;
  updatedAt: string;
}

// Levenshtein distance (오타 허용)
function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  if (q.length <= 3) return false;
  return levenshtein(t.slice(0, q.length + 2), q) <= Math.floor(q.length / 4);
}

function scoreItem(item: SearchIndexItem, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  const titleLower = item.title.toLowerCase();
  if (titleLower === q) score += 100;
  else if (titleLower.startsWith(q)) score += 60;
  else if (titleLower.includes(q)) score += 40;
  else if (fuzzyMatch(item.title, q)) score += 20;

  for (const tag of item.tags) {
    const tagLower = tag.toLowerCase();
    if (tagLower === q) score += 50;
    else if (tagLower.includes(q)) score += 25;
  }

  if (item.body.toLowerCase().includes(q)) score += 10;

  return score;
}

function extractSnippet(body: string, query: string): string {
  const q = query.toLowerCase();
  const lower = body.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return body.slice(0, 50).trim();
  const start = Math.max(0, idx - 20);
  const end = Math.min(body.length, idx + q.length + 30);
  const snippet = body.slice(start, end).trim();
  return (start > 0 ? '…' : '') + snippet + (end < body.length ? '…' : '');
}

export function searchIndex(
  items: SearchIndexItem[],
  query: string,
  sortBy: 'relevance' | 'date' = 'relevance'
): SearchResult[] {
  if (!query.trim()) {
    // 빈 쿼리: 최근 수정 순 최대 10개
    return [...items]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 10)
      .map((item) => ({
        path: item.path,
        title: item.title,
        tags: item.tags,
        snippet: item.body.slice(0, 50).trim(),
        score: 0,
        updatedAt: item.updatedAt,
      }));
  }

  const results: SearchResult[] = [];
  for (const item of items) {
    const score = scoreItem(item, query);
    if (score > 0) {
      results.push({
        path: item.path,
        title: item.title,
        tags: item.tags,
        snippet: extractSnippet(item.body, query),
        score,
        updatedAt: item.updatedAt,
      });
    }
  }

  if (sortBy === 'date') {
    results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } else {
    results.sort((a, b) => b.score - a.score);
  }

  return results;
}
