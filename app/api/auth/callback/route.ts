import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/login?error=token_exchange', request.url));
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(new URL('/login?error=token_denied', request.url));
  }

  const response = NextResponse.redirect(new URL('/select-repo', request.url));

  // Set access token as httpOnly cookie
  response.cookies.set('gh_token', tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  // Clear the state cookie
  response.cookies.delete('oauth_state');

  return response;
}
