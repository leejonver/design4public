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

  test('중간 화면에서 카테고리 필터가 잘리지 않는다', async ({ page }) => {
    await page.setViewportSize({ width: 1029, height: 779 })
    await page.goto('/projects')

    await expect(page.getByText('공간을 변화시킨 다양한 프로젝트를 만나보세요.')).toBeVisible()
    const filters = page.getByRole('group', { name: '카테고리 필터' })
    await expect(filters).toBeVisible()
    expect(await filters.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  })

  test('데스크톱 헤더에 조정된 타이포 토큰을 적용한다', async ({ page }) => {
    await page.setViewportSize({ width: 1029, height: 779 })
    await page.goto('/projects')

    await expect(page.locator('header .d4p-logotype')).toHaveCSS('font-size', '18px')
    await expect(page.locator('header nav a[href="/projects"]')).toHaveCSS('font-size', '14px')
  })
})
