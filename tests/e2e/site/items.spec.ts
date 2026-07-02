import { test, expect } from '@playwright/test'

test.describe('아이템', () => {
  test('목록에 아이템 카드와 브랜드명이 표시된다', async ({ page }) => {
    await page.goto('/items')
    await expect(page.getByRole('heading', { level: 1, name: 'ITEMS' })).toBeVisible()
    const card = page.locator('a.d4p-card[href="/items/aeron-chair"]')
    await expect(card).toBeVisible()
    await expect(card.locator('.d4p-card-overline')).toHaveText(/허먼밀러/)
  })

  test('아이템 상세에 브랜드 링크와 도입 프로젝트가 보인다', async ({ page }) => {
    await page.goto('/items/aeron-chair')
    await expect(page.getByRole('heading', { level: 1, name: '아에론 체어' })).toBeVisible()
    await expect(page.locator('a[href="/brands/herman-miller"]').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '도입 프로젝트' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/gangnam-office"]')).toBeVisible()
  })
})
