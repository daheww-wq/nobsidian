import { NextRequest, NextResponse } from 'next/server';
import { getRepoTree, getFile, putFile, deleteFile } from '@/lib/github/operations';
import type { GitHubTreeItem } from '@/types/github';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, oldPath, newPath } = (await request.json()) as {
    owner: string;
    repo: string;
    oldPath: string;
    newPath: string;
  };

  try {
    const tree = await getRepoTree(token, owner, repo, 'HEAD');
    const files = (tree as GitHubTreeItem[]).filter(
      (item) => item.type === 'blob' && item.path.startsWith(oldPath + '/')
    );

    await Promise.all(
      files.map(async (item) => {
        const newFilePath = item.path.replace(oldPath, newPath);
        const file = await getFile({ token, owner, repo, path: item.path });
        const content = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8');
        await putFile({
          token,
          owner,
          repo,
          path: newFilePath,
          content,
          message: `[dohohon] rename folder`,
        });
        await deleteFile({
          token,
          owner,
          repo,
          path: item.path,
          sha: file.sha,
          message: `[dohohon] rename cleanup`,
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Folder rename failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
