import { test, expect } from '@playwright/test'

test.describe('SEO 산출물', () => {
  test('sitemap.xml 이 게시 URL을 포함한다', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('/projects/gangnam-office')
    expect(body).toContain('/items/aeron-chair')
    expect(body).not.toContain('/projects/draft-project')
  })

  test('robots.txt 가 응답하고 sitemap을 가리킨다', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/sitemap/i)
  })

  test('JSON-LD 스크립트 태그가 존재한다', async ({ page }) => {
    await page.goto('/')
    const ld = page.locator('script[type="application/ld+json"]')
    await expect(ld).toHaveCount(1)
    const json = JSON.parse((await ld.textContent()) ?? '{}')
    expect(JSON.stringify(json)).toMatch(/WebSite|Organization/)
  })

  test('sitemap.xml 이 공개 사진 URL을 포함하고 아이템 갤러리 전용 사진은 제외한다', async ({
    request,
  }) => {
    const body = await (await request.get('/sitemap.xml')).text()
    expect(body).toContain('/photos/55555555-0000-0000-0000-000000000001')
    expect(body).not.toContain('/photos/55555555-0000-0000-0000-000000000006')
  })

  test('manifest.webmanifest 가 사이트 이름을 응답한다', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest')
    expect(res.status()).toBe(200)
    const json = JSON.parse(await res.text())
    expect(json.name).toContain('design4public')
  })
})

// Detail pages carry two application/ld+json scripts (layout org+website + page
// graph); parse all and collect every node's @type across both.
async function jsonLdTypes(page: import('@playwright/test').Page): Promise<string[]> {
  const scripts = page.locator('script[type="application/ld+json"]')
  const types: string[] = []
  for (let i = 0; i < (await scripts.count()); i++) {
    const parsed = JSON.parse((await scripts.nth(i).textContent()) ?? '{}')
    const nodes = parsed['@graph'] ?? [parsed]
    for (const n of nodes) if (n && n['@type']) types.push(n['@type'])
  }
  return types
}

test.describe('타입별 JSON-LD 구조화 데이터', () => {
  test('프로젝트 상세는 Article + ImageObject + BreadcrumbList를 포함한다', async ({ page }) => {
    await page.goto('/projects/gangnam-office')
    const types = await jsonLdTypes(page)
    expect(types).toContain('Article')
    expect(types).toContain('ImageObject')
    expect(types).toContain('BreadcrumbList')
  })

  test('아이템 상세는 Product + BreadcrumbList를 포함하고 Offer는 없다', async ({ page }) => {
    await page.goto('/items/aeron-chair')
    const types = await jsonLdTypes(page)
    expect(types).toContain('Product')
    expect(types).toContain('BreadcrumbList')
    expect(types).not.toContain('Offer')
  })

  test('브랜드 상세는 Brand + BreadcrumbList를 포함한다', async ({ page }) => {
    await page.goto('/brands/herman-miller')
    const types = await jsonLdTypes(page)
    expect(types).toContain('Brand')
    expect(types).toContain('BreadcrumbList')
  })

  test('사진 상세는 ImageObject + BreadcrumbList를 포함한다', async ({ page }) => {
    await page.goto('/photos/55555555-0000-0000-0000-000000000001')
    const types = await jsonLdTypes(page)
    expect(types).toContain('ImageObject')
    expect(types).toContain('BreadcrumbList')
  })
})

test.describe('사진 상세', () => {
  test('공개 사진은 200과 제목 + og:image를 렌더링한다', async ({ page }) => {
    const res = await page.goto('/photos/55555555-0000-0000-0000-000000000001')
    expect(res?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('강남 오피스 회의실')
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
    await expect(page).toHaveTitle(/강남 오피스 회의실/)
  })

  test('태그된 아이템이 있는 사진은 가구 블록을 표시한다', async ({ page }) => {
    await page.goto('/photos/55555555-0000-0000-0000-000000000003')
    await expect(page.getByText('이 사진 속 가구')).toBeVisible()
    await expect(page.getByText('아에론 체어')).toBeVisible()
  })

  test('아이템 갤러리 전용(비공개) 사진은 404', async ({ page }) => {
    const res = await page.goto('/photos/55555555-0000-0000-0000-000000000006')
    expect(res?.status()).toBe(404)
  })
})

test('사진 그리드 타일은 상세 페이지로 링크된다', async ({ page }) => {
  await page.goto('/photos')
  const firstTile = page.getByTestId('photo-tile').first()
  await expect(firstTile).toHaveAttribute('href', /\/photos\/[0-9a-f-]{36}/)
})
