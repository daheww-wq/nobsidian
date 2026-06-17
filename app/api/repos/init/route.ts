import { NextRequest, NextResponse } from 'next/server';
import { initNotegraphConfig } from '@/lib/github/operations';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { owner: string; repo: string; branch: string };
  const { owner, repo, branch } = body;

  if (!owner || !repo || !branch) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await initNotegraphConfig(token, owner, repo, branch);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Init config failed:', err);
    return NextResponse.json({ error: 'Init failed' }, { status: 500 });
  }
}
