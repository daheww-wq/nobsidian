import type { GraphData, GraphNode, GraphEdge } from '@/types/graph';
import { extractBacklinks } from '@/lib/markdown/backlinks';

interface NoteInfo {
  path: string;
  title: string;
  tags: string[];
  content: string;
}

const TAG_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#84cc16',
];

export function buildGraph(notes: NoteInfo[]): GraphData & { tagColorMap: Record<string, string> } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const allTags = [...new Set(notes.flatMap((n) => n.tags))];
  const tagColorMap: Record<string, string> = {};
  allTags.forEach((tag, i) => {
    tagColorMap[tag] = TAG_COLORS[i % TAG_COLORS.length];
  });

  // Build nodes
  for (const note of notes) {
    nodes.push({
      id: note.path,
      label: note.title,
      path: note.path,
      tags: note.tags,
    });
  }

  const pathIndex = new Map(notes.map((n) => [n.path, n]));
  const nameIndex = new Map(notes.map((n) => [n.title.toLowerCase(), n.path]));
  const filenameIndex = new Map(
    notes.map((n) => [n.path.split('/').pop()?.replace(/\.md$/, '').toLowerCase() ?? '', n.path])
  );

  // Build backlink edges
  for (const note of notes) {
    const links = extractBacklinks(note.content);
    for (const link of links) {
      const target = nameIndex.get(link.toLowerCase()) ?? filenameIndex.get(link.toLowerCase());
      if (target && target !== note.path) {
        edges.push({ source: note.path, target, type: 'backlink' });
      }
    }
  }

  // Build shared-tag edges (dotted)
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const shared = notes[i].tags.filter((t) => notes[j].tags.includes(t));
      if (shared.length > 0) {
        edges.push({ source: notes[i].path, target: notes[j].path, type: 'tag' });
      }
    }
  }

  return { nodes, edges, tagColorMap };
}
