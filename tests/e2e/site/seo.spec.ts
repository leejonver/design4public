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
})
