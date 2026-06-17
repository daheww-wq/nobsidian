// v2 — [[backlink]] parsing utilities

export function extractBacklinks(markdown: string): string[] {
  const matches = markdown.match(/\[\[([^\]]+)\]\]/g) ?? [];
  return matches.map((m) => m.slice(2, -2).trim());
}

export function replaceBacklinkTarget(markdown: string, oldName: string, newName: string): string {
  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return markdown.replace(new RegExp(`\\[\\[${escaped}\\]\\]`, 'g'), `[[${newName}]]`);
}
