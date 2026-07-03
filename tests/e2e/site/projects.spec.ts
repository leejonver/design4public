import { test, expect } from '@playwright/test'

test.describe('프로젝트 목록', () => {
  test('게시 프로젝트만 목록에 표시된다', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByRole('heading', { level: 1, name: 'PROJECTS' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/gangnam-office"]')).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/draft-project"]')).toHaveCount(0)
  })

  test('카테고리 필터 칩으로 좁힐 수 있다', async ({ page }) => {
    await page.goto('/projects')
    // "오피스" category → only gangnam-office (pangyo is 공공)
    await page.getByRole('button', { name: '오피스', exact: true }).click()
    await expect(page.locator('a.d4p-card[href="/projects/gangnam-office"]')).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toHaveCount(0)
    // back to All
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toBeVisible()
  })
})
