export interface NoteFrontmatter {
  id: string;
  title: string;
  created: string;
  updated: string;
  tags: string[];
  summary?: string; // v2
}

export interface NoteFile {
  id: string;
  title: string;
  path: string;
  sha: string;
  frontmatter: NoteFrontmatter;
  content: string; // markdown body without frontmatter
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  sha: string;
  children?: FileTreeNode[];
}
