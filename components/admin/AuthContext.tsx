'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import type { UserRole } from '@/lib/database.types'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isMaster: boolean
  isAdmin: boolean
  isContentManager: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchApprovedProfile(userId: string): Promise<AuthUser | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, name, role, status')
    .eq('id', userId)
    .single()
  if (!data || data.status !== 'approved') return null
  return { id: data.id, email: data.email, name: data.name, role: data.role }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const isMaster = user?.role === 'master'
  const isAdmin = user?.role === 'admin' || isMaster
  const isContentManager = user?.role === 'content_manager' || isAdmin

  const refresh = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    setUser(authUser ? await fetchApprovedProfile(authUser.id) : null)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh()
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    const profile = await fetchApprovedProfile(data.user.id)
    if (!profile) {
      await supabase.auth.signOut()
      throw new Error('이메일 인증 후 관리자 승인이 필요합니다. 승인 대기 중입니다.')
    }
    setUser(profile)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isMaster,
    isAdmin,
    isContentManager,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
