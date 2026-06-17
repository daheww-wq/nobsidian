import { NextRequest, NextResponse } from 'next/server';
import { putFile } from '@/lib/github/operations';

const INVALID_PATH = /\.\.|[<>:"|?*\x00-\x1F]/;

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, path, content } = (await request.json()) as {
    owner: string;
    repo: string;
    path: string;
    content: string;
  };

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (INVALID_PATH.test(path)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const result = await putFile({
      token,
      owner,
      repo,
      path,
      content,
      message: `[dohohon] create ${path}`,
    });
    return NextResponse.json({ sha: result.content?.sha ?? '' });
  } catch (err) {
    console.error('Create note failed:', err);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
