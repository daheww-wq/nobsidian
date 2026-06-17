import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
  test('비로그인 상태에서 / 접속 시 /login 으로 리다이렉트', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/login 페이지가 정상 렌더링', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /dohohon/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /github/i })).toBeVisible();
  });

  test('GitHub 로그인 버튼 클릭 시 GitHub OAuth URL로 리다이렉트', async ({ page }) => {
    await page.goto('/login');

    // 실제 GitHub 리다이렉트 대신 URL만 확인 (외부 서비스 호출 방지)
    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('github.com/login/oauth/authorize')),
      page.getByRole('link', { name: /github/i }).click(),
    ]);

    expect(request.url()).toContain('client_id=');
    expect(request.url()).toContain('scope=repo');
  });

  test('/api/auth/session — 비인증 시 401 반환', async ({ page }) => {
    const res = await page.request.get('/api/auth/session');
    expect(res.status()).toBe(401);
  });
});
