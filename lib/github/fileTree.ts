import type { FileTreeNode } from '@/types/note';
import type { GitHubTreeItem } from '@/types/github';

export function buildFileTree(items: GitHubTreeItem[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const nodeMap = new Map<string, FileTreeNode>();

  // Sort so folders come before files and paths are ordered
  const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));

  for (const item of sorted) {
    if (!item.path.endsWith('.md') && item.type !== 'tree') continue;

    const parts = item.path.split('/');
    const name = parts[parts.length - 1];

    const node: FileTreeNode = {
      name,
      path: item.path,
      type: item.type === 'tree' ? 'folder' : 'file',
      sha: item.sha,
      children: item.type === 'tree' ? [] : undefined,
    };

    nodeMap.set(item.path, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);
      if (parent?.children) {
        parent.children.push(node);
      }
    }
  }

  return root;
}
