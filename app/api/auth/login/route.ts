import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export function GET() {
  const state = randomBytes(16).toString('hex');

  // NEXTAUTH_URL 우선, 없으면 Vercel 자동 URL 사용 (VERCEL_URL은 https 없이 제공됨)
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/auth/callback`,
    scope: 'repo user:email',
    state,
  });

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);

  // store state in httpOnly cookie to verify on callback
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
