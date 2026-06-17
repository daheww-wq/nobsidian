import { test, expect } from '@playwright/test';
import { loginWithToken } from './helpers/auth';

test.describe('워크스페이스 — 파일 트리', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
  });

  test('워크스페이스 레이아웃 렌더링 (사이드바, 에디터 영역)', async ({ page }) => {
    await page.goto('/workspace');

    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('editor-area')).toBeVisible({ timeout: 10_000 });
  });

  test('사이드바 검색창에 입력 시 결과 표시', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10_000 });

    const searchInput = page.getByPlaceholder(/검색/);
    await searchInput.fill('test');

    // 검색 결과 영역이 나타나야 함
    await expect(page.getByTestId('search-results')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('워크스페이스 — 에디터', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
  });

  test('노트 열기 시 BlockNote 에디터 표시', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10_000 });

    const firstNote = page.getByTestId('file-item').first();
    if ((await firstNote.count()) > 0) {
      await firstNote.click();
      await expect(page.getByTestId('blocknote-editor')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('에디터 내 [[링크]] 타이핑 시 자동완성 드롭다운 표시', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10_000 });

    const firstNote = page.getByTestId('file-item').first();
    if ((await firstNote.count()) === 0) return; // 노트 없으면 스킵

    await firstNote.click();
    await page.waitForSelector('[data-testid="blocknote-editor"]', { timeout: 5_000 });

    // 에디터 클릭 후 [[  입력
    const editor = page.getByTestId('blocknote-editor');
    await editor.click();
    await page.keyboard.type('[[');

    // 자동완성 드롭다운 확인
    await expect(page.getByTestId('backlink-menu')).toBeVisible({ timeout: 3_000 });
  });
});
