// API 호출을 위한 유틸리티 함수들

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

// API 응답 타입 정의
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 기본 fetch 래퍼
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders: { 'Content-Type': string; 'Authorization'?: string } = {
    'Content-Type': 'application/json',
  }

  // 토큰이 있으면 Authorization 헤더 추가
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }
  }

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
  let url = `${API_BASE_URL}${endpoint}`
  
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
export async function apiPost<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT 요청
export async function apiPut<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// DELETE 요청
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  })
}

// 파일 업로드
export async function apiUpload(file: File, folder?: string): Promise<ApiResponse<any>> {
  const formData = new FormData()
  formData.append('file', file)
  if (folder) {
    formData.append('folder', folder)
  }

  const url = `${API_BASE_URL}/upload`
  
  // 토큰이 있으면 Authorization 헤더 추가
  const headers: Record<string, string> = {}
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
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
  getList: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    apiGet('/projects', params),
  
  getById: (id: string) => apiGet(`/projects/${id}`),
  
  create: (data: any) => apiPost('/projects', data),
  
  update: (id: string, data: any) => apiPut(`/projects/${id}`, data),
  
  delete: (id: string) => apiDelete(`/projects/${id}`),
}

// 브랜드 관련 API
export const brandsApi = {
  getList: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    apiGet('/brands', params),
  
  getById: (id: string) => apiGet(`/brands/${id}`),
  
  create: (data: any) => apiPost('/brands', data),
  
  update: (id: string, data: any) => apiPut(`/brands/${id}`, data),
  
  delete: (id: string) => apiDelete(`/brands/${id}`),
}

// 아이템 관련 API
export const itemsApi = {
  getList: (params?: { status?: string; search?: string; brandId?: string; page?: number; limit?: number }) =>
    apiGet('/items', params),
  
  getById: (id: string) => apiGet(`/items/${id}`),
  
  create: (data: any) => apiPost('/items', data),
  
  update: (id: string, data: any) => apiPut(`/items/${id}`, data),
  
  delete: (id: string) => apiDelete(`/items/${id}`),
}

// 태그 관련 API
export const tagsApi = {
  getList: (params?: { search?: string; page?: number; limit?: number }) =>
    apiGet('/tags', params),
  
  create: (data: { name: string }) => apiPost('/tags', data),
  
  update: (id: string, data: { name: string }) => apiPut(`/tags/${id}`, data),
  
  delete: (id: string) => apiDelete(`/tags/${id}`),
}

// 관리자 관련 API
export const managersApi = {
  getList: (params?: { status?: string; role?: string; search?: string; page?: number; limit?: number }) =>
    apiGet('/managers', params),
  
  getById: (id: string) => apiGet(`/managers/${id}`),
  
  update: (id: string, data: any) => apiPut(`/managers/${id}`, data),
  
  delete: (id: string) => apiDelete(`/managers/${id}`),
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
  tags: tagsApi,
  managers: managersApi,
}
