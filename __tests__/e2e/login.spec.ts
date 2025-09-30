/**
 * 로그인 E2E 테스트
 * Phase 1: E2E 통합 테스트
 */

import { test, expect } from '@playwright/test'

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('로그인 페이지가 로드되어야 합니다', async ({ page }) => {
    await expect(page).toHaveTitle(/design4public/i)
    await expect(page.getByText('로그인')).toBeVisible()
  })

  test('이메일과 비밀번호 입력 필드가 표시되어야 합니다', async ({ page }) => {
    const emailInput = page.getByLabel(/이메일/i)
    const passwordInput = page.getByLabel(/비밀번호/i)
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('빈 폼으로 제출 시 유효성 검사 메시지가 표시되어야 합니다', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /로그인/i })
    await submitButton.click()
    
    // Ant Design 폼 검증 메시지 확인
    await expect(page.getByText(/이메일.*입력/i)).toBeVisible({ timeout: 3000 })
  })

  test('유효하지 않은 이메일 형식은 거부되어야 합니다', async ({ page }) => {
    await page.getByLabel(/이메일/i).fill('invalid-email')
    await page.getByLabel(/비밀번호/i).fill('password123')
    await page.getByRole('button', { name: /로그인/i }).click()
    
    await expect(page.getByText(/유효한.*이메일/i)).toBeVisible({ timeout: 3000 })
  })
})

test.describe('로그인 기능', () => {
  test('마스터 계정으로 로그인이 가능해야 합니다', async ({ page }) => {
    await page.goto('/login')
    
    // 마스터 계정 자격 증명 입력
    await page.getByLabel(/이메일/i).fill('design4public@gmail.com')
    await page.getByLabel(/비밀번호/i).fill('dfourp7!@#')
    
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: /로그인/i }).click()
    
    // 프로젝트 페이지로 리다이렉트 되었는지 확인
    await expect(page).toHaveURL('/projects', { timeout: 5000 })
    
    // 사이드바가 표시되는지 확인
    await expect(page.getByText('design4public')).toBeVisible()
  })

  test('잘못된 자격 증명으로 로그인 시 에러 메시지가 표시되어야 합니다', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel(/이메일/i).fill('wrong@email.com')
    await page.getByLabel(/비밀번호/i).fill('wrongpassword')
    await page.getByRole('button', { name: /로그인/i }).click()
    
    // 에러 메시지 확인 (Ant Design message 또는 alert)
    await expect(page.getByText(/실패|오류|잘못/i)).toBeVisible({ timeout: 3000 })
  })
})
