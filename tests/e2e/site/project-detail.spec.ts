import { test, expect } from '@playwright/test'

test.describe('프로젝트 상세', () => {
  test('갤러리와 관련 아이템이 렌더링된다', async ({ page }) => {
    await page.goto('/projects/gangnam-office')
    await expect(page.getByRole('heading', { level: 1, name: '강남 오피스 리노베이션' })).toBeVisible()
    await expect(page.locator('.d4p-pmast-facts')).toHaveCSS('flex-direction', 'column')
    await expect(page.getByText('Overview', { exact: true })).toHaveCount(0)
    await expect(page.getByText('개요', { exact: true })).toHaveCount(0)
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

  test('직접 연결이 없어도 파생(사진→아이템) 관련 아이템이 표시된다', async ({ page }) => {
    // pangyo-library has zero project_items; its main photo is tagged with aeron
    // (seed derived row), so the union surfaces aeron as a related item.
    await page.goto('/projects/pangyo-library')
    await expect(page.getByRole('heading', { level: 2, name: '이 공간에 사용된 가구' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/items/aeron-chair"]')).toBeVisible()
  })

  test('넓은 화면에서 관련 아이템 카드가 갤러리 열 너비를 따른다', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/projects/gangnam-office')

    const galleryTile = await page.locator('.d4p-masonry-item').first().boundingBox()
    const itemCard = await page.locator('a.d4p-card[href="/items/aeron-chair"]').boundingBox()
    expect(galleryTile).not.toBeNull()
    expect(itemCard).not.toBeNull()
    expect(Math.abs(galleryTile!.width - itemCard!.width)).toBeLessThan(1)
  })
})
