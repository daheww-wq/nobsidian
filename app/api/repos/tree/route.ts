import { NextRequest, NextResponse } from 'next/server';
import { getRepoTree } from '@/lib/github/operations';
import { buildFileTree } from '@/lib/github/fileTree';
import type { GitHubTreeItem } from '@/types/github';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch') ?? 'main';

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
  }

  try {
    const rawTree = await getRepoTree(token, owner, repo, branch);
    const tree = buildFileTree(rawTree as GitHubTreeItem[]);
    return NextResponse.json({ tree });
  } catch (err) {
    console.error('Failed to get tree:', err);
    return NextResponse.json({ error: 'Failed to fetch file tree' }, { status: 500 });
  }
}
