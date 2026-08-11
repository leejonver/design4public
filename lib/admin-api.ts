// API 호출을 위한 유틸리티 함수들

import type { UploadResponse } from '@/lib/admin-types'

const API_BASE_URL = '/api/admin'

// API 응답 타입 정의
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 기본 fetch 래퍼
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  
  const defaultHeaders: { 'Content-Type': string } = {
    'Content-Type': 'application/json',
  }

  // 인증은 @supabase/ssr 쿠키 세션으로 처리된다(동일 출처 요청에 자동 포함).
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// GET 요청
export async function apiGet<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
  // API_BASE_URL이 이미 /api를 포함하고 있으면 중복 방지
  let url = endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  return apiRequest<T>(url)
}

// POST 요청
export async function apiPost<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`
  return apiRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT 요청
export async function apiPut<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`
  return apiRequest<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// DELETE 요청
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`
  return apiRequest<T>(url, {
    method: 'DELETE',
  })
}

// 파일 업로드 - Supabase Storage에 직접 업로드 (Vercel 제한 우회)
export async function apiUpload(file: File, folder?: string): Promise<ApiResponse<UploadResponse>> {
  try {
    const url = `${API_BASE_URL}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `파일 업로드에 실패했습니다: HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
    };
  }
}

export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  upload: apiUpload,
}
