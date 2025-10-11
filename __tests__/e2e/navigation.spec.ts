/**
 * 네비게이션 E2E 테스트
 * Phase 1: E2E 통합 테스트
 */

import { test, expect } from '@playwright/test'

test.describe('사이드바 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    // 먼저 로그인
    await page.goto('/login')
    await page.getByPlaceholder('이메일 주소').fill('design4public@gmail.com')
    await page.getByPlaceholder('비밀번호').fill('dfourp7!@#')
    await page.getByRole('button', { name: /로그인/i }).click()
    await page.waitForURL('/projects')
  })

  test('모든 메뉴 항목이 표시되어야 합니다', async ({ page }) => {
    await expect(page.getByRole('menuitem', { name: /프로젝트/ })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /아이템/ })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /브랜드/ })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /태그/ })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /관리자/ })).toBeVisible()
  })

  test('프로젝트 메뉴 클릭 시 프로젝트 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('menuitem', { name: /프로젝트/ }).click()
    await expect(page).toHaveURL('/projects')
  })

  test('아이템 메뉴 클릭 시 아이템 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('menuitem', { name: /아이템/ }).click()
    await expect(page).toHaveURL('/items')
  })

  test('브랜드 메뉴 클릭 시 브랜드 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('menuitem', { name: /브랜드/ }).click()
    await expect(page).toHaveURL('/brands')
  })

  test('태그 메뉴 클릭 시 태그 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('menuitem', { name: /태그/ }).click()
    await expect(page).toHaveURL('/tags')
  })

  test('관리자 메뉴 클릭 시 관리자 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('menuitem', { name: /관리자/ }).click()
    await expect(page).toHaveURL('/managers')
  })

  test('로그아웃 버튼 클릭 시 로그인 페이지로 이동해야 합니다', async ({ page }) => {
    await page.getByRole('button', { name: /로그아웃/ }).click()
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })
})
