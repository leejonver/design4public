import { test, expect } from '@playwright/test'

test.describe('홈', () => {
  test('시드의 대표 프로젝트가 히어로에 렌더링된다', async ({ page }) => {
    await page.goto('/')
    // site_settings.featured_project_id → gangnam-office
    await expect(page.locator('.d4p-hero')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: '강남 오피스 리노베이션' })).toBeVisible()
    await expect(page.locator('.d4p-hero').getByRole('link', { name: '프로젝트 자세히 보기' }))
      .toHaveAttribute('href', '/projects/gangnam-office')
  })

  test('큐레이션 섹션 헤딩이 모두 보인다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: '주목할 만한 프로젝트' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '최근 등록된 포토' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '인기 아이템' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '등록된 브랜드' })).toBeVisible()
  })

  test('홈 프로젝트 카드가 게시 프로젝트로 연결된다', async ({ page }) => {
    await page.goto('/')
    // The hero project (gangnam-office) is intentionally excluded from the card
    // grid by fetchHomeData; pangyo-library is the published curation card.
    await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]').first()).toBeVisible()
    // draft project must never surface publicly
    await expect(page.locator('a.d4p-card[href="/projects/draft-project"]')).toHaveCount(0)
  })
})
