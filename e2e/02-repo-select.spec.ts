import { test, expect } from '@playwright/test';
import { loginWithToken } from './helpers/auth';

test.describe('레포 선택 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
  });

  test('/select-repo 진입 시 레포 목록이 표시', async ({ page }) => {
    await page.goto('/select-repo');

    // 레포 카드 또는 목록 로딩 대기
    await expect(page.getByTestId('repo-list')).toBeVisible({ timeout: 10_000 });
  });

  test('레포 선택 후 /workspace 로 이동', async ({ page }) => {
    await page.goto('/select-repo');
    await page.waitForSelector('[data-testid="repo-list"]', { timeout: 10_000 });

    const firstRepo = page.getByTestId('repo-item').first();
    await firstRepo.click();

    await expect(page).toHaveURL(/\/workspace/, { timeout: 10_000 });
  });
});
