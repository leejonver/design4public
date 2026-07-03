import { test, expect } from '@playwright/test'

test.describe('프로젝트 상세', () => {
  test('갤러리와 관련 아이템이 렌더링된다', async ({ page }) => {
    await page.goto('/projects/gangnam-office')
    await expect(page.getByRole('heading', { level: 1, name: '강남 오피스 리노베이션' })).toBeVisible()
    // gallery tiles (3 seeded project_photos)
    await expect(page.locator('.d4p-masonry .d4p-photo-tile').first()).toBeVisible()
    // related items block ("이 공간에 사용된 가구")
    await expect(page.getByRole('heading', { level: 2, name: '이 공간에 사용된 가구' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/items/aeron-chair"]')).toBeVisible()
  })

  test('갤러리 타일 클릭 시 라이트박스가 열린다', async ({ page }) => {
    await page.goto('/projects/gangnam-office')
    await page.locator('.d4p-masonry .d4p-photo-tile').first().click()
    await expect(page.getByRole('dialog', { name: '사진 보기' })).toBeVisible()
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByRole('dialog', { name: '사진 보기' })).toHaveCount(0)
  })

  test('초안 프로젝트 상세는 404', async ({ page }) => {
    const res = await page.goto('/projects/draft-project')
    expect(res?.status()).toBe(404)
  })
})
