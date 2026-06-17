import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/github/operations';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const file = await getFile({ token, owner, repo, path });
    const content = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8');
    return NextResponse.json({ content, sha: file.sha });
  } catch (err) {
    console.error('Get note failed:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
