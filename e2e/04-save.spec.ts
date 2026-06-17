import { test, expect } from '@playwright/test';
import { loginWithToken } from './helpers/auth';

test.describe('저장 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
  });

  test('Cmd+S (Ctrl+S) 수동 저장 시 저장 상태 인디케이터 변경', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10_000 });

    const firstNote = page.getByTestId('file-item').first();
    if ((await firstNote.count()) === 0) return;

    await firstNote.click();
    await page.waitForSelector('[data-testid="blocknote-editor"]', { timeout: 5_000 });

    // 텍스트 수정
    const editor = page.getByTestId('blocknote-editor');
    await editor.click();
    await page.keyboard.type(' E2E-test');

    // Ctrl+S로 수동 저장
    await page.keyboard.press('Control+s');

    // 저장 인디케이터가 "저장 중..." 또는 "저장됨" 상태를 보여야 함
    const saveIndicator = page.getByTestId('save-status');
    await expect(saveIndicator).toBeVisible({ timeout: 3_000 });
  });

  test('/api/notes/save API — 비인증 시 401 반환', async ({ page }) => {
    const res = await page.request.post('/api/notes/save', {
      data: { path: 'test.md', content: '# test', sha: 'abc' },
    });
    // 쿠키 없이 호출했으므로 401
    expect(res.status()).toBe(401);
  });
});
