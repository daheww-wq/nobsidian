'use client';

import { useEffect, useState } from 'react';
import { useRepoStore } from '@/store/repoStore';
import { useFileTreeStore } from '@/store/fileTreeStore';
import { parseFrontmatter } from '@/lib/markdown/frontmatter';
import { buildGraph } from '@/lib/graph/buildGraph';
import type { GraphData } from '@/types/graph';
import type { FileTreeNode } from '@/types/note';

interface NoteData {
  path: string;
  title: string;
  tags: string[];
  content: string;
}

function flattenFiles(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];
  for (const n of nodes) {
    if (n.type === 'file') paths.push(n.path);
    else if (n.children) paths.push(...flattenFiles(n.children));
  }
  return paths;
}

export function useGraphData() {
  const { selectedRepo } = useRepoStore();
  const { tree } = useFileTreeStore();
  const [graphData, setGraphData] = useState<
    (GraphData & { tagColorMap: Record<string, string> }) | null
  >(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loadedKey, setLoadedKey] = useState('');

  const depsKey = `${selectedRepo?.id ?? ''}-${tree.length}`;
  const isLoading = !!selectedRepo && tree.length > 0 && depsKey !== loadedKey;

  useEffect(() => {
    if (!selectedRepo || tree.length === 0) return;

    const owner = selectedRepo.full_name.split('/')[0];
    const key = `${selectedRepo.id}-${tree.length}`;
    const filePaths = flattenFiles(tree);

    Promise.all(
      filePaths.map((path) =>
        fetch(
          `/api/notes/get?owner=${owner}&repo=${selectedRepo.name}&path=${encodeURIComponent(path)}`
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { content: string } | null): NoteData | null => {
            if (!d) return null;
            const { frontmatter, body } = parseFrontmatter(d.content);
            return { path, title: frontmatter.title, tags: frontmatter.tags, content: body };
          })
          .catch(() => null)
      )
    )
      .then((notes) => {
        const valid = notes.filter(Boolean) as NoteData[];
        setGraphData(buildGraph(valid));
        setAllTags([...new Set(valid.flatMap((n) => n.tags))]);
        setLoadedKey(key);
      })
      .catch(() => setLoadedKey(key));
  }, [selectedRepo, tree]);

  return { graphData, allTags, isLoading };
}
