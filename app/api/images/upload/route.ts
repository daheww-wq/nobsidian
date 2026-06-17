import { NextRequest, NextResponse } from 'next/server';
import { createOctokit } from '@/lib/github/client';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { owner, repo, path, base64, mimeType } = (await request.json()) as {
    owner: string;
    repo: string;
    path: string;
    base64: string;
    mimeType: string;
  };

  if (!ALLOWED_MIME.includes(mimeType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  try {
    const octokit = createOctokit(token);
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: '[dohohon] upload image',
      content: base64,
    });

    // Return raw GitHub content URL
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`;
    return NextResponse.json({ url, sha: data.content?.sha });
  } catch (err) {
    console.error('Image upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
