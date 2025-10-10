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
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  
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
export async function apiPost<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`
  return apiRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT 요청
export async function apiPut<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
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
export async function apiUpload(file: File, folder?: string): Promise<ApiResponse<{ url: string }>> {
  try {
    // 동적 import로 supabase 클라이언트 가져오기
    const { supabase } = await import('@/lib/supabase');
    
    const folderPath = folder || 'uploads';
    
    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;
    
    // Supabase Storage에 직접 업로드
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: `파일 업로드에 실패했습니다: ${error.message}`
      };
    }
    
    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);
    
    return {
      success: true,
      data: {
        url: urlData.publicUrl
      }
    };
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
