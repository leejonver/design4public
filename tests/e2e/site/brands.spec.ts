import { test, expect } from '@playwright/test'

test.describe('브랜드', () => {
  test('목록에 브랜드 카드가 표시된다', async ({ page }) => {
    await page.goto('/brands')
    await expect(page.getByRole('heading', { level: 1, name: 'BRANDS' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/brands/herman-miller"]')).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/brands/vitra"]')).toBeVisible()
  })

  test('브랜드 상세에 이름과 대표 아이템이 보인다', async ({ page }) => {
    await page.goto('/brands/herman-miller')
    await expect(page.getByRole('heading', { level: 1, name: '허먼밀러' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '대표 아이템' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/items/aeron-chair"]')).toBeVisible()
  })
})
