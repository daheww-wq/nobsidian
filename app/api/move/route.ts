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
    const item = (tree as GitHubTreeItem[]).find((i) => i.path === oldPath);

    if (item?.type === 'blob') {
      // single file move
      const file = await getFile({ token, owner, repo, path: oldPath });
      const content = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8');
      await putFile({
        token,
        owner,
        repo,
        path: newPath,
        content,
        message: `[dohohon] move ${oldPath}`,
      });
      await deleteFile({
        token,
        owner,
        repo,
        path: oldPath,
        sha: file.sha,
        message: `[dohohon] move cleanup`,
      });
    } else {
      // folder move — batch rename all children
      const files = (tree as GitHubTreeItem[]).filter(
        (i) => i.type === 'blob' && i.path.startsWith(oldPath + '/')
      );
      await Promise.all(
        files.map(async (f) => {
          const newFilePath = f.path.replace(oldPath, newPath);
          const file = await getFile({ token, owner, repo, path: f.path });
          const content = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8');
          await putFile({
            token,
            owner,
            repo,
            path: newFilePath,
            content,
            message: `[dohohon] move`,
          });
          await deleteFile({
            token,
            owner,
            repo,
            path: f.path,
            sha: file.sha,
            message: `[dohohon] move cleanup`,
          });
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Move failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
