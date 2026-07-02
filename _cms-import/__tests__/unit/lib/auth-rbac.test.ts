import { hasRole, type SessionUser } from '@/lib/auth'

// Minimal SessionUser cast — hasRole only reads `role`.
const asUser = (role: SessionUser['role']): SessionUser => ({ role } as SessionUser)

describe('hasRole', () => {
  it('grants access when the role meets or exceeds the minimum', () => {
    expect(hasRole(asUser('admin'), 'content_manager')).toBe(true)
    expect(hasRole(asUser('master'), 'admin')).toBe(true)
    expect(hasRole(asUser('master'), 'content_manager')).toBe(true)
  })

  it('grants access when the role exactly matches the minimum', () => {
    expect(hasRole(asUser('content_manager'), 'content_manager')).toBe(true)
    expect(hasRole(asUser('admin'), 'admin')).toBe(true)
    expect(hasRole(asUser('master'), 'master')).toBe(true)
  })

  it('denies access when the role is below the minimum', () => {
    expect(hasRole(asUser('content_manager'), 'master')).toBe(false)
    expect(hasRole(asUser('content_manager'), 'admin')).toBe(false)
    expect(hasRole(asUser('admin'), 'master')).toBe(false)
  })

  it('denies access for a null user', () => {
    expect(hasRole(null, 'content_manager')).toBe(false)
    expect(hasRole(null, 'master')).toBe(false)
  })
})
