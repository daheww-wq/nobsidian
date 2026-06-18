import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import type { NoteFrontmatter } from '@/types/note';

export function parseFrontmatter(
  raw: string,
  fallbackPath?: string
): { frontmatter: NoteFrontmatter; body: string } {
  try {
    const { data, content } = matter(raw);
    const fm = data as Partial<NoteFrontmatter>;
    // frontmatter title 없으면 H1, 그것도 없으면 파일명, 최후에 'Untitled'
    const bodyText = content.trimStart();
    const h1Match = bodyText.match(/^#+\s+(.+?)(?:\r?\n|$)/m);
    const filenameTitle = fallbackPath?.split('/').pop()?.replace(/\.md$/, '');
    const resolvedTitle = fm.title || h1Match?.[1]?.trim() || filenameTitle || 'Untitled';
    return {
      frontmatter: {
        id: fm.id ?? uuidv4(),
        title: resolvedTitle,
        created: fm.created ?? new Date().toISOString(),
        updated: fm.updated ?? new Date().toISOString(),
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        summary: fm.summary,
      },
      body: content.trimStart(),
    };
  } catch {
    return {
      frontmatter: {
        id: uuidv4(),
        title: 'Untitled',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tags: [],
      },
      body: raw,
    };
  }
}

export function serializeFrontmatter(fm: NoteFrontmatter, body: string): string {
  const data: Record<string, unknown> = {
    id: fm.id,
    title: fm.title,
    created: fm.created,
    updated: new Date().toISOString(),
    tags: fm.tags,
  };
  if (fm.summary) data.summary = fm.summary;
  return matter.stringify(body, data);
}

export function buildInitialNote(title: string): string {
  return serializeFrontmatter(
    {
      id: uuidv4(),
      title,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: [],
    },
    ''
  );
}
