import { NextRequest, NextResponse } from 'next/server';
import { createOctokit } from '@/lib/github/client';
import { getFile, putFile } from '@/lib/github/operations';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, path, commitSha } = (await request.json()) as {
    owner: string;
    repo: string;
    path: string;
    commitSha: string;
  };

  try {
    const octokit = createOctokit(token);

    // Get file content at that commit
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref: commitSha });
    if (Array.isArray(data)) throw new Error('Path is dir');
    const content = Buffer.from(
      (data as { content: string }).content.replace(/\n/g, ''),
      'base64'
    ).toString('utf-8');

    // Get current SHA
    const current = await getFile({ token, owner, repo, path });
    const fileName = path.split('/').pop() ?? path;

    const result = await putFile({
      token,
      owner,
      repo,
      path,
      content,
      message: `[restore] ${fileName} — restored to ${commitSha.slice(0, 7)}`,
      sha: current.sha,
    });

    return NextResponse.json({ content, sha: result.content?.sha ?? '' });
  } catch (err) {
    console.error('Restore failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
