/**
 * 네비게이션 E2E 테스트
 * Vapor UI 사이드바(next/link) + @supabase/ssr 쿠키 인증 기준
 */

import { test, expect } from '@playwright/test'
import path from 'node:path'

test.describe('사이드바 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/projects')
  })

  test('모든 메뉴 항목이 표시되어야 합니다', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(nav.getByRole('link', { name: /프로젝트/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /사진/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /아이템/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /브랜드/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /카테고리 설정/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /사용자관리/ })).toBeVisible() // master only
  })

  test('사진 메뉴 클릭 시 사진 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /사진/ }).click()
    await expect(page).toHaveURL(/\/admin\/photos$/)
  })

  test('아이템 메뉴 클릭 시 아이템 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /아이템/ }).click()
    await expect(page).toHaveURL(/\/admin\/items$/)
  })

  test('브랜드 메뉴 클릭 시 브랜드 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /브랜드/ }).click()
    await expect(page).toHaveURL(/\/admin\/brands$/)
  })

  test('카테고리 설정 메뉴 클릭 시 카테고리 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /카테고리 설정/ }).click()
    await expect(page).toHaveURL(/\/admin\/categories$/)
  })

  test('사용자관리 메뉴 클릭 시 관리자 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /사용자관리/ }).click()
    await expect(page).toHaveURL(/\/admin\/managers$/)
  })

  test('로그아웃 버튼 클릭 시 로그인 페이지로 이동해야 합니다', async ({ browser }) => {
    // The app's signOut is global scope, so run this in a dedicated session —
    // logging out the shared master user would redirect the rest of the
    // admin/integration suites to /admin/login.
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, '../.auth/logout.json'),
    })
    const page = await context.newPage()
    await page.goto('/admin/projects')
    await page.getByRole('button', { name: /로그아웃/ }).click()
    await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 8000 })
    await context.close()
  })
})

test('모바일 사이드바는 본문을 압축하지 않고 펼쳐진다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/projects')
  const expand = page.getByRole('button', { name: '사이드바 펼치기' })
  await expect(expand).toBeVisible()
  const main = page.locator('main')
  await expect(main).toHaveCSS('margin-left', '72px')
  const search = await page.getByRole('searchbox').boundingBox()
  expect(search!.width).toBeGreaterThan(200)
  const before = await main.boundingBox()
  expect(before!.width).toBeGreaterThan(300)
  await expand.click()
  await expect(page.getByRole('button', { name: '사이드바 접기' })).toBeVisible()
  const after = await main.boundingBox()
  expect(after!.width).toBe(before!.width)
  await page.getByRole('button', { name: '사이드바 접기' }).click()
  await expect(page.getByRole('heading', { name: '프로젝트 관리' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})
