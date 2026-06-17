import { NextRequest, NextResponse } from 'next/server';
import { getRepoTree, getFile, deleteFile } from '@/lib/github/operations';
import type { GitHubTreeItem } from '@/types/github';

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, path } = (await request.json()) as {
    owner: string;
    repo: string;
    path: string;
  };

  try {
    const tree = await getRepoTree(token, owner, repo, 'HEAD');
    const files = (tree as GitHubTreeItem[]).filter(
      (item) => item.type === 'blob' && item.path.startsWith(path + '/')
    );

    await Promise.all(
      files.map(async (item) => {
        const file = await getFile({ token, owner, repo, path: item.path });
        await deleteFile({
          token,
          owner,
          repo,
          path: item.path,
          sha: file.sha,
          message: `[dohohon] delete folder`,
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Folder delete failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
