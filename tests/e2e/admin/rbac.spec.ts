import { test, expect } from '@playwright/test'
import path from 'node:path'

test.describe('RBAC', () => {
  test('master는 관리자 관리 페이지를 볼 수 있다', async ({ page }) => {
    await page.goto('/admin/managers')
    await expect(page.getByRole('heading', { name: '관리자 관리' })).toBeVisible()
  })

  test('content_manager는 관리자 관리 접근이 거부된다', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, '../.auth/manager.json'),
    })
    const page = await context.newPage()
    // Nav link hidden for non-master
    await page.goto('/admin/projects')
    await expect(page.getByRole('navigation').getByRole('link', { name: /사용자관리/ })).toHaveCount(0)
    // Direct visit shows the in-page guard (no redirect)
    await page.goto('/admin/managers')
    await expect(page.getByText('접근 권한이 없습니다')).toBeVisible()
    // Server enforces 403 on the API
    const res = await page.request.get('/api/admin/managers')
    expect(res.status()).toBe(403)
    await context.close()
  })
})
