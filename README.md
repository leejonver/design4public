# Design4Public CMS

공공디자인 프로젝트와 가구 브랜드를 관리하는 콘텐츠 관리 시스템입니다. 이 저장소는 CMS 관리자 웹앱의 소스이며, v1.0.0 기준 정식 배포 상태입니다.

- 버전: v1.0.0
- 라이브 URL: 프로덕션 배포 URL은 배포 플랫폼 대시보드에서 확인하세요.

## 📋 소개

**Design4Public CMS**는 다음 데이터를 체계적으로 관리합니다.
- 프로젝트, 아이템(가구/제품), 브랜드, 태그, 관리자
- 이미지 업로드 및 대표 이미지 설정
- 권한 기반 접근 제어(마스터/관리자/콘텐츠매니저)

## 🔧 기술 스택

- Next.js 14 (App Router), React 18, TypeScript 5
- UI: Ant Design 5, @ant-design/icons 6
- 데이터/백엔드: Supabase (Auth, PostgREST, Storage)
- 테스트: Jest, React Testing Library, Playwright(E2E)

## 🚀 빠른 시작

### 요구사항
- Node.js 18+

### 설치/실행
```bash
npm install
npm run dev
# http://localhost:3000
```

### 환경 변수 (.env.local 예시)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📁 주요 구조
```
src/
├─ app/                # App Router 페이지 & API Routes
│  ├─ api/             # Next.js Route Handlers (REST)
│  ├─ projects/ items/ brands/ tags/ managers/
│  └─ login/ signup/
├─ components/         # 공통 컴포넌트 (MainLayout, Sidebar 등)
├─ contexts/           # AuthContext 등
├─ lib/                # api 유틸, supabase 클라이언트
└─ types/              # 전역 타입 정의
```

## 🧩 주요 기능
- 프로젝트/아이템/브랜드 CRUD
- 태그 타입 분리 및 관리
- 관리자 관리(권한/승인/인라인 편집)
- 이미지 업로드(Supabase Storage)

## 🔐 권한 모델
- 마스터: 전체 권한
- 관리자: 콘텐츠 관리 권한
- 콘텐츠매니저: 제한적 권한

## 🧪 테스트
```bash
npm test              # 단위/통합
npm run test:e2e      # E2E (Playwright)
```

## 📚 추가 문서
- API 연동 가이드: `API_INTEGRATION_GUIDE.md`
- 컴포넌트 가이드: `COMPONENT_GUIDE.md`
- 배포 가이드: `DEPLOYMENT_GUIDE.md`
- 테스트 가이드: `TESTING_GUIDE.md`

## 🚢 배포
- 권장: Vercel (Next.js 최적화)
- 배포 전 체크: 타입/린트 통과, 환경 변수 설정, Supabase 스키마/정책 적용

## 🔒 보안 유의사항
- 실제 키는 `.env*`로만 관리 (커밋 금지)
- RLS 정책으로 공개/비공개 데이터 접근 제어

## 📝 라이선스
MIT
