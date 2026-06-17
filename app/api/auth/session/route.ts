import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gh_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Fetch GitHub user info to validate token
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!userRes.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = (await userRes.json()) as {
    login: string;
    name: string | null;
    avatar_url: string;
  };

  return NextResponse.json({
    authenticated: true,
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
    },
  });
}
