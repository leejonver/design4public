/**
 * 네비게이션 E2E 테스트
 * Vapor UI 사이드바(next/link) + @supabase/ssr 쿠키 인증 기준
 *
 * 로그인이 필요하므로 마스터(승인됨) 계정 자격 증명을 환경 변수로 주입합니다.
 *   E2E_MASTER_EMAIL / E2E_MASTER_PASSWORD
 * (하드코딩된 개발용 마스터 계정은 코드에서 제거되었습니다.)
 */

import { test, expect } from '@playwright/test'

const MASTER_EMAIL = process.env.E2E_MASTER_EMAIL ?? ''
const MASTER_PASSWORD = process.env.E2E_MASTER_PASSWORD ?? ''

test.describe('사이드바 네비게이션', () => {
  test.skip(
    !MASTER_EMAIL || !MASTER_PASSWORD,
    'E2E_MASTER_EMAIL / E2E_MASTER_PASSWORD 환경 변수가 필요합니다.'
  )

  test.beforeEach(async ({ page }) => {
    // 먼저 로그인 (쿠키 세션 발급)
    await page.goto('/login')
    await page.getByPlaceholder('이메일 주소').fill(MASTER_EMAIL)
    await page.getByPlaceholder('비밀번호').fill(MASTER_PASSWORD)
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(/\/projects/)
  })

  test('모든 메뉴 항목이 표시되어야 합니다', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(nav.getByRole('link', { name: /프로젝트/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /사진/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /아이템/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /브랜드/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /태그/ })).toBeVisible()
    // 관리자 메뉴는 마스터 권한에서만 노출됩니다.
    await expect(nav.getByRole('link', { name: /관리자/ })).toBeVisible()
  })

  test('프로젝트 메뉴 클릭 시 프로젝트 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /프로젝트/ }).click()
    await expect(page).toHaveURL(/\/projects$/)
  })

  test('사진 메뉴 클릭 시 사진 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /사진/ }).click()
    await expect(page).toHaveURL(/\/photos$/)
  })

  test('아이템 메뉴 클릭 시 아이템 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /아이템/ }).click()
    await expect(page).toHaveURL(/\/items$/)
  })

  test('브랜드 메뉴 클릭 시 브랜드 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /브랜드/ }).click()
    await expect(page).toHaveURL(/\/brands$/)
  })

  test('태그 메뉴 클릭 시 태그 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /태그/ }).click()
    await expect(page).toHaveURL(/\/tags$/)
  })

  test('관리자 메뉴 클릭 시 관리자 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /관리자/ }).click()
    await expect(page).toHaveURL(/\/managers$/)
  })

  test('로그아웃 버튼 클릭 시 로그인 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('button', { name: /로그아웃/ }).click()
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 })
  })
})
