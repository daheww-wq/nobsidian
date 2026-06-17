import { NextRequest, NextResponse } from 'next/server';
import { createOctokit } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const octokit = createOctokit(token);
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      affiliation: 'owner',
    });

    const repos = data.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch,
      updated_at: r.updated_at ?? '',
    }));

    return NextResponse.json({ repos });
  } catch (err) {
    console.error('Failed to list repos:', err);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
