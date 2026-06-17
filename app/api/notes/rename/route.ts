import { NextRequest, NextResponse } from 'next/server';
import { getFile, putFile, deleteFile } from '@/lib/github/operations';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, oldPath, newPath } = (await request.json()) as {
    owner: string;
    repo: string;
    oldPath: string;
    newPath: string;
  };

  if (!owner || !repo || !oldPath || !newPath) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // GET old file
    const old = await getFile({ token, owner, repo, path: oldPath });
    const content = Buffer.from(old.content.replace(/\n/g, ''), 'base64').toString('utf-8');

    // PUT to new path
    await putFile({
      token,
      owner,
      repo,
      path: newPath,
      content,
      message: `[dohohon] rename ${oldPath} → ${newPath}`,
    });

    // DELETE old path
    await deleteFile({
      token,
      owner,
      repo,
      path: oldPath,
      sha: old.sha,
      message: `[dohohon] rename cleanup`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Rename failed:', err);
    return NextResponse.json({ error: 'Failed to rename' }, { status: 500 });
  }
}
