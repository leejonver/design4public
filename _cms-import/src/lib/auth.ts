// Server-side authentication & RBAC. renewal_requirements.md §6-1, §8.
// Roles: master (everything) > admin (content CRUD) > content_manager (limited CRUD, no user mgmt).
import 'server-only'
import { NextResponse } from 'next/server'
import { createServerSupabase } from './supabase-server'
import type { UserRole, ApprovalStatus } from './database.types'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: ApprovalStatus
}

const RANK: Record<UserRole, number> = {
  content_manager: 1,
  admin: 2,
  master: 3,
}

export function hasRole(user: SessionUser | null, min: UserRole): boolean {
  return !!user && RANK[user.role] >= RANK[min]
}

/** Returns the approved, authenticated caller, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') return null
  return profile as SessionUser
}

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new AuthError(401, '인증이 필요합니다.')
  return user
}

export async function requireRole(min: UserRole): Promise<SessionUser> {
  const user = await requireUser()
  if (!hasRole(user, min)) throw new AuthError(403, '권한이 없습니다.')
  return user
}

/** Maps an AuthError to a JSON error response; rethrows anything else. */
export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status })
  }
  throw error
}
