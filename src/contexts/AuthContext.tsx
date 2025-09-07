'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '@/lib/api'
import { CurrentUser } from '@/types'

interface AuthContextType {
  user: CurrentUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isMaster: boolean
  isAdmin: boolean
  isContentManager: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  // 권한 체크 헬퍼 함수들
  const isMaster = user?.role === 'master'
  const isAdmin = user?.role === 'admin' || isMaster
  const isContentManager = user?.role === 'content_manager' || isAdmin

  // 로그인 함수
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password) as any
      
      if (response.success) {
        setUser(response.data.user)
        
        // 토큰 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.data.session.access_token)
        }
      } else {
        throw new Error(response.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // 회원가입 함수
  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.signup(name, email, password) as any
      
      if (!response.success) {
        throw new Error(response.error || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      
      // 토큰 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
      }
    }
  }

  // 초기 로딩 시 토큰 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          // 토큰이 있으면 사용자 정보를 가져오는 로직을 여기에 추가할 수 있습니다
          // 현재는 단순히 토큰만 확인
        }
      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    isMaster,
    isAdmin,
    isContentManager,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
