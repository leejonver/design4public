import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrandSearch } from '@/components/site/brand-search'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

describe('BrandSearch IME Enter guard', () => {
  beforeEach(() => {
    push.mockReset()
    // No search results needed: an empty fetch keeps the "run" option as the default.
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ groups: {} }) })) as unknown as typeof fetch)
  })

  it('ignores Enter fired while an IME composition is in progress', () => {
    render(<BrandSearch />)
    const input = screen.getByPlaceholderText('프로젝트, 아이템, 브랜드 검색')
    fireEvent.change(input, { target: { value: '라운지' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(push).not.toHaveBeenCalled()
  })

  it('navigates on a normal (non-composing) Enter with the value intact', () => {
    render(<BrandSearch />)
    const input = screen.getByPlaceholderText('프로젝트, 아이템, 브랜드 검색')
    fireEvent.change(input, { target: { value: '라운지' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/search?q=%EB%9D%BC%EC%9A%B4%EC%A7%80')
  })
})
