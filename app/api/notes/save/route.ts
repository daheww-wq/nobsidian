import { NextRequest, NextResponse } from 'next/server';
import { putFile } from '@/lib/github/operations';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, path, content, sha, isManual } = (await request.json()) as {
    owner: string;
    repo: string;
    path: string;
    content: string;
    sha: string;
    isManual: boolean;
  };

  if (!owner || !repo || !path || !sha) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const fileName = path.split('/').pop() ?? path;
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const message = isManual
    ? `[save] ${fileName} — ${timestamp}`
    : `[autosave] ${fileName} — ${timestamp}`;

  try {
    const result = await putFile({ token, owner, repo, path, content, message, sha });
    return NextResponse.json({ sha: result.content?.sha ?? '' });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 409) {
      return NextResponse.json({ error: 'conflict' }, { status: 409 });
    }
    console.error('Save failed:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
