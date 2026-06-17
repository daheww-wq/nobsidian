import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, getFile } from '@/lib/github/operations';

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, path, sha } = (await request.json()) as {
    owner: string;
    repo: string;
    path: string;
    sha: string;
  };

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // sha might be stale — fetch latest if not provided
    let fileSha = sha;
    if (!fileSha) {
      const f = await getFile({ token, owner, repo, path });
      fileSha = f.sha;
    }
    await deleteFile({
      token,
      owner,
      repo,
      path,
      sha: fileSha,
      message: `[dohohon] delete ${path}`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete failed:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
