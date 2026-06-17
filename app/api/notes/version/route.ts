import { NextRequest, NextResponse } from 'next/server';
import { createOctokit } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');
  const sha = searchParams.get('sha');

  if (!owner || !repo || !path || !sha) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const octokit = createOctokit(token);
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref: sha });

    if (Array.isArray(data) || data.type !== 'file') {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return NextResponse.json({ content });
  } catch (err) {
    console.error('Version fetch failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
