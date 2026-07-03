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
export async function apiGet<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
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

// 인증 관련 API
export const authApi = {
  login: (email: string, password: string) =>
    apiPost('/auth/login', { email, password }),
  
  signup: (name: string, email: string, password: string) =>
    apiPost('/auth/signup', { name, email, password }),
  
  logout: () => apiPost('/auth/logout'),
}

// 프로젝트 관련 API
export const projectsApi = {
  getList: (params?: { status?: string; search?: string; sort?: string; dir?: 'asc' | 'desc'; page?: number; limit?: number }) =>
    apiGet('/projects', params),
  
  getById: (id: string) => apiGet(`/projects/${id}`),
  
  create: (data: unknown) => apiPost('/projects', data),

  update: (id: string, data: unknown) => apiPut(`/projects/${id}`, data),
  
  delete: (id: string) => apiDelete(`/projects/${id}`),
}

// 브랜드 관련 API
export const brandsApi = {
  getList: (params?: { status?: string; search?: string; sort?: string; dir?: 'asc' | 'desc'; page?: number; limit?: number }) =>
    apiGet('/brands', params),
  
  getById: (id: string) => apiGet(`/brands/${id}`),
  
  create: (data: unknown) => apiPost('/brands', data),
  
  update: (id: string, data: unknown) => apiPut(`/brands/${id}`, data),
  
  delete: (id: string) => apiDelete(`/brands/${id}`),
}

// 아이템 관련 API
export const itemsApi = {
  getList: (params?: { status?: string; search?: string; brandId?: string; sort?: string; dir?: 'asc' | 'desc'; page?: number; limit?: number }) =>
    apiGet('/items', params),
  
  getById: (id: string) => apiGet(`/items/${id}`),
  
  create: (data: unknown) => apiPost('/items', data),
  
  update: (id: string, data: unknown) => apiPut(`/items/${id}`, data),
  
  delete: (id: string) => apiDelete(`/items/${id}`),
}

// 카테고리 관련 API (typed classification: project | item)
export const categoriesApi = {
  getList: (params?: { type?: string; search?: string; sort?: string; dir?: 'asc' | 'desc'; page?: number; limit?: number }) =>
    apiGet('/categories', params),

  getById: (id: string) => apiGet(`/categories/${id}`),

  create: (data: { name: string; type: string }) => apiPost('/categories', data),

  update: (id: string, data: { name?: string; type?: string }) => apiPut(`/categories/${id}`, data),

  delete: (id: string) => apiDelete(`/categories/${id}`),
}

// 태그 관련 API (free-form labels, no type)
export const tagsApi = {
  getList: (params?: { search?: string; limit?: number }) =>
    apiGet('/tags', params),

  create: (data: { name: string }) => apiPost('/tags', data),

  delete: (id: string) => apiDelete(`/tags/${id}`),
}

// 사진 관련 API (생성은 프로젝트·아이템 폼에서만 처리)
export const photosApi = {
  getList: (params?: { search?: string; unconnected?: boolean; sort?: string; dir?: 'asc' | 'desc'; page?: number; limit?: number }) =>
    apiGet('/photos', {
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.unconnected ? { unconnected: 'true' } : {}),
      ...(params?.sort ? { sort: params.sort } : {}),
      ...(params?.dir ? { dir: params.dir } : {}),
      ...(params?.page ? { page: params.page } : {}),
      ...(params?.limit ? { limit: params.limit } : {}),
    }),

  getById: (id: string) => apiGet(`/photos/${id}`),

  delete: (id: string) => apiDelete(`/photos/${id}`),
}

// 관리자 관련 API
export const managersApi = {
  getList: (params?: { status?: string; role?: string; search?: string; sort?: string; page?: number; limit?: number }) =>
    apiGet('/managers', params),
  
  getById: (id: string) => apiGet(`/managers/${id}`),
  
  update: (id: string, data: unknown) => apiPut(`/managers/${id}`, data),
  
  delete: (id: string) => apiDelete(`/managers/${id}`),
}

// 홈 화면 설정 API
export const homeSettingsApi = {
  get: () => apiGet('/home-settings'),
  update: (data: unknown) => apiPut('/home-settings', data),
}

// 통합 API 객체
export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  upload: apiUpload,
  auth: authApi,
  projects: projectsApi,
  brands: brandsApi,
  items: itemsApi,
  categories: categoriesApi,
  tags: tagsApi,
  photos: photosApi,
  managers: managersApi,
  homeSettings: homeSettingsApi,
}
