import { NextRequest, NextResponse } from 'next/server';
import { createOctokit } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');
  const page = parseInt(searchParams.get('page') ?? '1');

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const octokit = createOctokit(token);
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      path,
      per_page: 50,
      page,
    });

    const commits = data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      date: c.commit.author?.date ?? '',
      author: c.commit.author?.name ?? '',
    }));

    return NextResponse.json({ commits });
  } catch (err) {
    console.error('History fetch failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
