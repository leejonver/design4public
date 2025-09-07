// Design4Public CMS - 더미 데이터
// 백엔드 API 연동 전까지 사용되는 테스트 데이터
// TODO: 백엔드 연동 시 이 파일은 삭제하고 API 호출로 대체

/**
 * 백엔드 API 연동 가이드:
 * 
 * 1. 각 데이터는 실제 백엔드 API 응답 구조와 동일하게 구성됨
 * 2. 모든 날짜는 ISO 8601 형식 사용 (예: 2024-01-01T00:00:00Z)
 * 3. 이미지 URL은 CDN 또는 서버 절대경로로 대체 필요
 * 4. 상태값(status)은 enum으로 관리하여 일관성 유지
 * 5. 관계형 데이터는 ID 참조로 구성 (예: brand.id, tag.id)
 * 
 * API 엔드포인트 매핑:
 * - GET /api/projects -> dummyProjects
 * - GET /api/items -> dummyItems  
 * - GET /api/brands -> dummyBrands
 * - GET /api/tags -> dummyTags
 * - GET /api/managers -> dummyManagers (마스터 권한 필요)
 * 
 * 주의사항:
 * - 권한 체크는 서버에서 처리 필요
 * - 이미지 업로드는 multipart/form-data 형식으로 전송
 * - 페이지네이션, 검색, 필터링 기능 추가 고려
 */

import {
  Project,
  Item,
  Brand,
  Tag,
  Manager
} from '@/types';

// =================== 더미 태그 데이터 ===================
// 백엔드 연동 시 API: GET /api/tags
export const dummyTags: Tag[] = [
  { id: '1', name: '사무실', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '2', name: '학교', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '3', name: '병원', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '4', name: '공공기관', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '5', name: '의자', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '6', name: '책상', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '7', name: '캐비닛', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '8', name: '회의실', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '9', name: '강의실', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '10', name: '접수대', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '11', name: '대기실', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '12', name: '진료실', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '13', name: '수납', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '14', name: '보관', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '15', name: '모던', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '16', name: '클래식', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '17', name: '심플', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '18', name: '고급', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '19', name: '실용적', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '20', name: '편안함', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// =================== 더미 브랜드 데이터 ===================
// 백엔드 연동 시 API: GET /api/brands
export const dummyBrands: Brand[] = [
  {
    id: '1',
    name: '에이스퍼니처',
    description: '국내 최고의 사무용 가구 전문 제조기업으로, 혁신적인 디자인과 최고급 재료를 사용하여 품격 있는 사무환경을 조성합니다.',
    logoImage: {
      id: 'logo1',
      url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center',
      alt: '에이스퍼니처 로고'
    },
    coverImage: {
      id: 'cover1',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=400&fit=crop',
      alt: '에이스퍼니처 커버 이미지'
    },
    websiteUrl: 'https://acefurniture.co.kr',
    status: 'visible',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '모던오피스',
    description: '현대적인 사무공간을 위한 가구 솔루션을 제공하는 기업입니다. 기능성과 디자인의 완벽한 조화를 추구합니다.',
    logoImage: {
      id: 'logo2',
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center',
      alt: '모던오피스 로고'
    },
    coverImage: {
      id: 'cover2',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
      alt: '모던오피스 커버 이미지'
    },
    websiteUrl: 'https://modernoffice.kr',
    status: 'visible',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '헬스케어가구',
    description: '병원 및 의료시설 전문 가구를 생산하는 기업으로, 위생적이고 기능적인 디자인을 제공합니다.',
    logoImage: {
      id: 'logo3',
      url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop&crop=center',
      alt: '헬스케어가구 로고'
    },
    coverImage: {
      id: 'cover3',
      url: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&h=400&fit=crop',
      alt: '헬스케어가구 커버 이미지'
    },
    websiteUrl: 'https://healthcarefurniture.co.kr',
    status: 'visible',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: '에듀케이션퍼니처',
    description: '교육기관을 위한 맞춤형 가구를 전문으로 하는 기업입니다. 학생과 교사의 편안함과 학습 효율을 고려한 디자인을 제공합니다.',
    logoImage: {
      id: 'logo4',
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop&crop=center',
      alt: '에듀케이션퍼니처 로고'
    },
    coverImage: {
      id: 'cover4',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
      alt: '에듀케이션퍼니처 커버 이미지'
    },
    websiteUrl: 'https://educationfurniture.co.kr',
    status: 'visible',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: '퍼블릭스페이스',
    description: '공공시설 및 대형 공간을 위한 가구 솔루션을 제공하는 기업입니다. 내구성과 실용성을 최우선으로 합니다.',
    logoImage: {
      id: 'logo5',
      url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=200&h=200&fit=crop&crop=center',
      alt: '퍼블릭스페이스 로고'
    },
    coverImage: {
      id: 'cover5',
      url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=400&fit=crop',
      alt: '퍼블릭스페이스 커버 이미지'
    },
    websiteUrl: 'https://publicspace.co.kr',
    status: 'visible',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// 더미 아이템 데이터
export const dummyItems: Item[] = [
  {
    id: '1',
    name: '프리미엄 사무용 의자',
    description: '인체공학적 디자인의 고급 사무용 의자로 장시간 작업에도 편안함을 제공합니다.',
    images: [
      {
        id: 'item1_img1',
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
        alt: '프리미엄 사무용 의자',
        isMain: true
      },
      {
        id: 'item1_img2',
        url: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=400&fit=crop',
        alt: '프리미엄 사무용 의자 측면'
      }
    ],
    mallUrl: 'https://mall.g2b.go.kr/item/12345',
    brand: dummyBrands[0],
    tags: [dummyTags[0], dummyTags[4], dummyTags[14], dummyTags[19]],
    status: 'available',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '모던 사무용 책상',
    description: '깔끔한 디자인의 모던 사무용 책상으로 효율적인 작업공간을 제공합니다.',
    images: [
      {
        id: 'item2_img1',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop',
        alt: '모던 사무용 책상',
        isMain: true
      }
    ],
    mallUrl: 'https://mall.g2b.go.kr/item/12346',
    brand: dummyBrands[1],
    tags: [dummyTags[0], dummyTags[5], dummyTags[14], dummyTags[16]],
    status: 'available',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '메디컬 캐비닛',
    description: '병원용 의료기기 및 약품 보관에 최적화된 전문 캐비닛입니다.',
    images: [
      {
        id: 'item3_img1',
        url: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&h=400&fit=crop',
        alt: '메디컬 캐비닛',
        isMain: true
      }
    ],
    mallUrl: 'https://mall.g2b.go.kr/item/12347',
    brand: dummyBrands[2],
    tags: [dummyTags[2], dummyTags[6], dummyTags[11], dummyTags[18]],
    status: 'available',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: '학생용 책상세트',
    description: '학교 교실용으로 적합한 튼튼하고 실용적인 책상세트입니다.',
    images: [
      {
        id: 'item4_img1',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        alt: '학생용 책상세트',
        isMain: true
      }
    ],
    mallUrl: 'https://mall.g2b.go.kr/item/12348',
    brand: dummyBrands[3],
    tags: [dummyTags[1], dummyTags[5], dummyTags[8], dummyTags[16]],
    status: 'available',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: '접수대 데스크',
    description: '공공기관 및 은행 등에 적합한 전문적인 디자인의 접수대입니다.',
    images: [
      {
        id: 'item5_img1',
        url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=400&fit=crop',
        alt: '접수대 데스크',
        isMain: true
      }
    ],
    mallUrl: 'https://mall.g2b.go.kr/item/12349',
    brand: dummyBrands[4],
    tags: [dummyTags[3], dummyTags[6], dummyTags[9], dummyTags[17]],
    status: 'available',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: '컨퍼런스 테이블',
    description: '회의실용 대형 컨퍼런스 테이블로 최대 12인까지 수용 가능합니다.',
    images: [
      {
        id: 'item6_img1',
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
        alt: '컨퍼런스 테이블',
        isMain: true
      }
    ],
    mallUrl: 'https://mall.g2b.go.kr/item/12350',
    brand: dummyBrands[0],
    tags: [dummyTags[0], dummyTags[5], dummyTags[7], dummyTags[15]],
    status: 'available',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// 더미 프로젝트 데이터
export const dummyProjects: Project[] = [
  {
    id: '1',
    name: '서울시청 신청사 사무환경 구축',
    description: '서울시청 신청사의 효율적인 업무환경 조성을 위한 종합적인 사무가구 및 공간설계 프로젝트입니다.',
    location: '서울시 중구',
    completionYear: 2024,
    area: 8500,
    images: [
      {
        id: 'proj1_img1',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
        alt: '서울시청 신청사 전경',
        isMain: true
      },
      {
        id: 'proj1_img2',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
        alt: '서울시청 신청사 사무실'
      },
      {
        id: 'proj1_img3',
        url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop',
        alt: '서울시청 신청사 회의실'
      }
    ],
    tags: [dummyTags[0], dummyTags[3], dummyTags[6], dummyTags[14]],
    connectedItems: [dummyItems[0], dummyItems[1], dummyItems[5]],
    inquiryUrl: 'https://forms.gle/seoulCityHall',
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '국립중앙의료원 현대화 프로젝트',
    description: '국립중앙의료원의 의료환경 개선을 위한 종합적인 공간 리모델링 및 의료가구 도입 프로젝트입니다.',
    location: '서울시 종로구',
    completionYear: 2024,
    area: 12000,
    images: [
      {
        id: 'proj2_img1',
        url: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&h=400&fit=crop',
        alt: '국립중앙의료원 전경',
        isMain: true
      },
      {
        id: 'proj2_img2',
        url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
        alt: '국립중앙의료원 진료실'
      }
    ],
    tags: [dummyTags[2], dummyTags[6], dummyTags[11], dummyTags[17]],
    connectedItems: [dummyItems[2]],
    inquiryUrl: 'https://forms.gle/nationalMedicalCenter',
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '서울대학교 교육환경 개선',
    description: '서울대학교의 현대적인 교육환경 조성을 위한 강의실 및 연구공간 개선 프로젝트입니다.',
    location: '서울시 관악구',
    completionYear: 2023,
    area: 5500,
    images: [
      {
        id: 'proj3_img1',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
        alt: '서울대학교 강의실',
        isMain: true
      },
      {
        id: 'proj3_img2',
        url: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=600&h=400&fit=crop',
        alt: '서울대학교 연구실'
      }
    ],
    tags: [dummyTags[1], dummyTags[5], dummyTags[8], dummyTags[15]],
    connectedItems: [dummyItems[3]],
    inquiryUrl: 'https://forms.gle/seoulNationalUniversity',
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: '부산시민공원 관리사무소 리모델링',
    description: '부산시민공원의 효율적인 관리를 위한 관리사무소 공간 개선 및 가구 교체 프로젝트입니다.',
    location: '부산시 부산진구',
    completionYear: 2024,
    area: 3200,
    images: [
      {
        id: 'proj4_img1',
        url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
        alt: '부산시민공원 관리사무소',
        isMain: true
      }
    ],
    tags: [dummyTags[3], dummyTags[6], dummyTags[13], dummyTags[16]],
    connectedItems: [dummyItems[1], dummyItems[4]],
    inquiryUrl: 'https://forms.gle/busanCitizensPark',
    status: 'draft',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: '인천국제공항 제2여객터미널 완공',
    description: '인천국제공항 제2여객터미널의 완공을 기념하여 터미널 내 상업시설 및 대기공간의 가구 설치를 완료하였습니다.',
    location: '인천시 중구',
    completionYear: 2023,
    area: 18500,
    images: [
      {
        id: 'proj5_img1',
        url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
        alt: '인천국제공항 제2여객터미널',
        isMain: true
      },
      {
        id: 'proj5_img2',
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
        alt: '인천국제공항 대기실'
      }
    ],
    tags: [dummyTags[3], dummyTags[5], dummyTags[10], dummyTags[17]],
    connectedItems: [dummyItems[4], dummyItems[5]],
    inquiryUrl: 'https://forms.gle/incheonAirport',
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: '대전시립도서관 신축공사',
    description: '대전시립도서관의 신축공사를 완료하고, 독서환경 최적화를 위한 가구 및 공간설계를 진행하였습니다.',
    location: '대전시 서구',
    completionYear: 2024,
    area: 6800,
    images: [
      {
        id: 'proj6_img1',
        url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
        alt: '대전시립도서관 전경',
        isMain: true
      },
      {
        id: 'proj6_img2',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
        alt: '대전시립도서관 열람실'
      }
    ],
    tags: [dummyTags[3], dummyTags[5], dummyTags[6], dummyTags[14]],
    connectedItems: [dummyItems[1], dummyItems[3]],
    inquiryUrl: 'https://forms.gle/daejeonLibrary',
    status: 'hidden',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// 더미 관리자 데이터
export const dummyManagers: Manager[] = [
  {
    id: '1',
    name: 'Design4Public',
    email: 'design4public@gmail.com',
    role: 'master',
    approvalStatus: 'approved',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T09:00:00Z'
  }
];

// 현재 로그인된 사용자 (더미)
export const currentUser: Manager = dummyManagers[0];
