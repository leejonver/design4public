import { test, expect } from '@playwright/test'
import type { ImageData } from '@/lib/admin-types'

const AERON = '44444444-0000-0000-0000-000000000001'

// Photos an item is tagged on via a project (project → photo → item) are shown
// read-only in the item editor, apart from the item's own uploads (request 2026-09-04 #14).
// Counts come from the API rather than the seed so other specs' tagging changes can't skew them.
test('연관 프로젝트 사진은 업로드 목록과 분리된 읽기 전용 카드로 보인다', async ({ page }) => {
  const { data } = await (await page.request.get(`/api/admin/items/${AERON}`)).json()
  const images: ImageData[] = data.images
  const linked = images.filter((img) => img.projectId).length
  const own = images.length - linked
  expect(linked, 'seed tags aeron on at least one project photo').toBeGreaterThan(0)

  await page.goto(`/admin/items/${AERON}/edit`)
  await expect(page.getByPlaceholder('아이템명을 입력하세요')).toHaveValue('아에론 체어')
  await expect(page.getByText(`연관 프로젝트 사진 (${linked})`, { exact: true })).toBeVisible()
  await expect(page.getByTestId('uploaded-photo')).toHaveCount(own)
  // linked photos carry no per-photo controls (no 삭제 / 대표 / reorder)
  await expect(page.getByRole('button', { name: '사진 삭제' })).toHaveCount(own)
})
