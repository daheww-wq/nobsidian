import { NextRequest, NextResponse } from 'next/server';
import { getFile, putFile } from '@/lib/github/operations';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, path, content } = (await request.json()) as {
    owner: string;
    repo: string;
    path: string;
    content: string;
  };

  try {
    const current = await getFile({ token, owner, repo, path });
    const result = await putFile({
      token,
      owner,
      repo,
      path,
      content,
      message: `[save] ${path.split('/').pop()} — force overwrite`,
      sha: current.sha,
    });
    return NextResponse.json({ sha: result.content?.sha ?? '' });
  } catch (err) {
    console.error('Force save failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
