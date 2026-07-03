import { test, expect } from '@playwright/test'

test.describe('아이템 상세', () => {
  test('도입 프로젝트에 직접 연결(강남) + 파생 연결(판교)이 모두 표시된다', async ({ page }) => {
    // aeron is directly linked only to gangnam (project_items). It is tagged on a
    // pangyo project photo (seed derived row), so the union adds pangyo.
    await page.goto('/items/aeron-chair')
    await expect(page.getByRole('heading', { level: 2, name: '도입 프로젝트' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/gangnam-office"]')).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toBeVisible()
  })
})
