// Design4Public CMS - TypeScript 타입 정의
// 백엔드 API와의 일관성을 위해 추가/수정 시 주의 필요

// Enum single source of truth. These unions are DB-derived (lib/database.types.ts,
// kept in sync by scripts/postprocess-types.mjs); admin DTOs and the API routes
// import the same definitions so a schema value can never drift between them.
// `ManagerRole` is this repo's name for the DB `UserRole` (identical members).
import type {
  ProjectStatus,
  ItemStatus,
  ApprovalStatus,
  CategoryType,
  UserRole,
} from './database.types';
export type { ProjectStatus, ItemStatus, ApprovalStatus, CategoryType };
export type ManagerRole = UserRole;

/**
 * 이미지 데이터 인터페이스
 * 프로젝트, 아이템, 브랜드에서 사용되는 이미지 정보
 */
export interface ImageData {
  id: string;
  url: string; // 이미지 URL (절대경로 및 CDN URL 지원)
  alt: string; // 대체 텍스트 (접근성을 위해 필수)
  isMain?: boolean; // 대표 이미지 여부 (기본: false)
  title?: string; // 사진 제목 (선택)
  order?: number; // 표시 순서 (0-기반)
  itemIds?: string[]; // 이 사진에 태깅된 아이템 id (프로젝트→사진→아이템 파생 모델)
}

/**
 * 홈 화면 설정 (Featured 프로젝트 + 메인 노출 목록)
 */
export interface HomeFeaturedItem {
  entityType: 'project' | 'item' | 'photo' | 'brand';
  entityId: string;
  order: number;
}
export interface HomeSettings {
  featuredProjectId: string | null;
  featured: HomeFeaturedItem[];
}

/**
 * 카테고리 인터페이스 (엔티티별 고정 분류, 카테고리 설정에서 관리)
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType; // project | item
  createdAt: string;
  updatedAt: string;
}

/**
 * 태그 인터페이스 (type 무관 자유 라벨, 프로젝트/아이템/사진에 자유롭게 연결)
 */
export interface Tag {
  id: string;
  name: string; // 태그명
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식
}

/**
 * 사진 인터페이스
 * 독립적인 사진 콘텐츠 정보
 */
export interface Photo {
  id: string;
  imageUrl: string; // 이미지 URL (Supabase Storage)
  altText?: string; // 대체 텍스트 (접근성)
  title?: string; // 사진 제목 (선택)
  description?: string; // 사진 설명 (선택)
  connectedItems: Item[]; // 연결된 아이템 배열
  tags: Tag[]; // 연결된 태그 배열
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식
}

/**
 * 프로젝트 인터페이스
 * 공공디자인 프로젝트 정보
 */
export interface Project {
  id: string;
  name: string; // 프로젝트명 (2-100자)
  description: string; // 설명 (10-1000자)
  client?: string; // 클라이언트(발주처)
  location: string; // 지역 (예: "서울시 강남구")
  completionYear: number; // 완공연도 (1900-현재+10년)
  area?: number; // 면적 (m², 1 이상, 선택사항)
  images: ImageData[]; // 프로젝트 이미지 배열
  categories: Category[]; // 연결된 카테고리 (project 타입)
  tags: Tag[]; // 연결된 자유 태그
  connectedItems: Item[]; // 연결된 아이템 배열
  inquiryUrl?: string; // 문의 URL (옵션)
  status: ProjectStatus;
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식
}

/**
 * 아이템 인터페이스
 * 가구 등 제품 아이템 정보
 */
export interface Item {
  id: string;
  name: string; // 아이템명 (2-100자)
  description: string; // 설명 (10-1000자)
  images: ImageData[]; // 아이템 이미지 배열
  mallUrl?: string; // 나라장터 URL (옵션)
  brand: Brand; // 소속 브랜드
  categories: Category[]; // 연결된 카테고리 (item 타입)
  tags: Tag[]; // 연결된 자유 태그
  slug: string; // URL 친화적인 식별자
  status: ItemStatus;
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식
}

/**
 * 브랜드 인터페이스
 * 제조사 또는 브랜드 정보
 */
export interface Brand {
  id: string;
  name: string; // 기본 이름으로 nameKo를 사용
  nameKo: string; // 브랜드명 (한글)
  nameEn?: string; // 브랜드명 (영문)
  description: string; // 설명 (10-500자)
  logoImageUrl?: string; // 브랜드 로고 이미지 URL (옵션)
  coverImageUrl?: string; // 커버 이미지 URL (옵션)
  websiteUrl?: string; // 브랜드 웹사이트 URL (옵션)
  status?: 'visible' | 'hidden'; // 노출 상태 (기본: visible)
  slug: string; // URL 친화적인 식별자
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식
}

/**
 * 관리자 인터페이스
 * CMS 시스템 관리자 정보
 */
export interface Manager {
  id: string;
  name: string; // 관리자명 (빈 값 가능, 나중에 수정)
  email: string; // 이메일 (유일값, 로그인 ID)
  role: ManagerRole; // 권한 레벨
  approvalStatus: ApprovalStatus; // 승인 상태
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식
  lastLoginAt?: string; // 마지막 로그인 시간 (옵션)
}

export interface UploadResponse {
  url: string;
  path?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  type?: string;
}
