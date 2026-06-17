import { Page } from '@playwright/test';

/**
 * GitHub OAuth 로그인을 시뮬레이션하기 위해 미리 발급된 토큰으로 쿠키를 직접 설정한다.
 * CI 환경에서는 TEST_GITHUB_TOKEN 환경변수가 필요하다.
 */
export async function loginWithToken(page: Page) {
  const token = process.env.TEST_GITHUB_TOKEN;
  if (!token) {
    throw new Error('TEST_GITHUB_TOKEN 환경변수가 설정되지 않았습니다.');
  }

  await page.context().addCookies([
    {
      name: 'gh_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

export async function logout(page: Page) {
  await page.goto('/api/auth/logout');
}
