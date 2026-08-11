import { render, screen } from '@testing-library/react'
import { BrandCard } from '@/components/site/cards'
import type { BrandSummary } from '@/lib/types'

const brand: BrandSummary = {
  id: 'brand-1',
  slug: 'sang-a-library-systems',
  nameKo: '상아라이브러리시스템즈',
  nameEn: 'SANG-A LIBRARY SYSTEMS',
  description: null,
  logo: '/brand-logo.png',
  cover: '/brand-cover.jpg',
  website: null,
  itemCount: 0,
  projectCount: 0,
  updatedAt: '2026-08-11T00:00:00.000Z',
}

describe('BrandCard', () => {
  it('커버 대신 로고를 썸네일로 표시한다', () => {
    render(<BrandCard brand={brand} />)

    const imageSrc = screen.getByRole('img').getAttribute('src')
    expect(imageSrc).toContain('brand-logo.png')
    expect(imageSrc).not.toContain('brand-cover.jpg')
    expect(screen.getByText(brand.nameKo)).toHaveStyle({ fontSize: 'var(--fs-body)' })
  })

  it('로고가 없으면 영문명을 중앙에, 한글명을 좌하단에 표시한다', () => {
    render(<BrandCard brand={{ ...brand, logo: null }} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(brand.nameEn!)).toBeInTheDocument()
    expect(screen.getByText(brand.nameKo)).toHaveStyle({ fontSize: 'var(--fs-body)' })
  })
})
