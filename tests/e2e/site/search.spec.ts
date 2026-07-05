import { test, expect } from '@playwright/test'

test.describe('통합 검색', () => {
  test('헤더 검색: 한국어 부분일치로 프로젝트가 뜬다 (강남)', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('프로젝트, 아이템, 브랜드 검색').first()
    await input.click()
    await input.fill('강남')
    // Debounced /api/search → grouped dropdown. Wait for the project result row.
    await expect(page.locator('.d4p-srch-panel')).toContainText('강남 오피스 리노베이션')
  })

  test('헤더 검색: 아이템 부분일치 (아에론)', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('프로젝트, 아이템, 브랜드 검색').first()
    await input.click()
    await input.fill('아에론')
    await expect(page.locator('.d4p-srch-panel')).toContainText('아에론 체어')
  })

  test('전체 검색(Enter) → /search 그룹 결과 페이지', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('프로젝트, 아이템, 브랜드 검색').first()
    await input.click()
    await input.fill('강남')
    await input.press('Enter')
    await page.waitForURL(/\/search\?q=/)
    await expect(page.getByRole('heading', { level: 1, name: 'SEARCH' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /프로젝트/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /강남 오피스 리노베이션/ })).toBeVisible()
  })

  test('/search 는 아이템과 파생 프로젝트를 함께 보여준다 (아에론)', async ({ page }) => {
    await page.goto('/search?q=아에론')
    // aeron item + the projects whose body includes the linked item name.
    // exact: the photo '아에론 체어 클로즈업' also matches '아에론 체어' as a substring.
    await expect(page.getByRole('link', { name: '아에론 체어', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /강남 오피스 리노베이션/ })).toBeVisible()
  })

  test('/projects?q= 필터가 동작한다', async ({ page }) => {
    await page.goto('/projects?q=강남')
    await expect(page.locator('a.d4p-card[href="/projects/gangnam-office"]')).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toHaveCount(0)
  })

  test('/api/search 는 빈 쿼리에 빈 그룹을 반환한다', async ({ request }) => {
    const res = await request.get('/api/search?q=')
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.groups).toEqual({ project: [], item: [], brand: [], photo: [] })
  })

  test('AI 캡션으로 사진이 검색된다 (가죽 소파)', async ({ page }) => {
    // '가죽 소파' appears ONLY in photo …001's ai_caption (not its title/alt/project),
    // so a hit proves the caption flows into search_source → search_index → hybrid_search.
    await page.goto('/search?q=가죽 소파')
    await expect(page.getByRole('heading', { level: 2, name: /포토/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /강남 오피스 회의실/ })).toBeVisible()
  })

  test('헤더 검색: IME 조합 중 Enter는 무시된다 (한글 중복 방지)', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('프로젝트, 아이템, 브랜드 검색').first()
    await input.click()
    await input.fill('라운지')
    // Enter dispatched WHILE composing must not navigate.
    await input.evaluate((el) =>
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true }),
      ),
    )
    await expect(page).toHaveURL(/\/$/)
    // A normal (non-composing) Enter navigates with the value intact — no dup char.
    await input.evaluate((el) =>
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: false }),
      ),
    )
    await page.waitForURL(/\/search\?q=/)
    expect(new URL(page.url()).searchParams.get('q')).toBe('라운지')
  })
})
