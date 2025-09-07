# Design4Public CMS

공공디자인 프로젝트와 가구 브랜드를 관리하는 콘텐츠 관리 시스템입니다.

## 📋 프로젝트 개요

**Design4Public CMS**는 공공디자인 프로젝트, 가구 아이템, 브랜드를 체계적으로 관리할 수 있는 웹 기반 CMS 시스템입니다.

### 주요 기능

- **프로젝트 관리**: 공공디자인 프로젝트의 생성, 편집, 조회
- **아이템 관리**: 가구 및 제품 아이템의 관리
- **브랜드 관리**: 제조사 및 브랜드 정보 관리
- **태그 시스템**: 콘텐츠 분류를 위한 태그 관리
- **관리자 시스템**: 권한 기반 사용자 관리
- **이미지 업로드**: 프로젝트 및 제품 이미지 관리

### 기술 스택

- **Frontend**: Next.js 14.2.32 (App Router), React 18.3.1, TypeScript 5
- **UI Library**: Ant Design v5.27.3
- **Styling**: CSS-in-JS (Ant Design 내장)
- **상태 관리**: React useState/useEffect
- **라우팅**: Next.js App Router

### 사용자 권한

- **마스터**: 모든 기능 접근 가능
- **관리자**: 콘텐츠 관리 기능 접근
- **콘텐츠매니저**: 제한적 기능 접근

## 🚀 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm, yarn, pnpm 또는 bun

### 설치 및 실행

```bash
# 의존성 설치
npm install
# 또는
yarn install

# 개발 서버 실행
npm run dev
# 또는
yarn dev

# 브라우저에서 http://localhost:3000 접속
```

### 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── brands/            # 브랜드 관리 페이지
│   ├── items/             # 아이템 관리 페이지
│   ├── projects/          # 프로젝트 관리 페이지
│   ├── tags/              # 태그 관리 페이지
│   ├── managers/          # 관리자 관리 페이지
│   ├── login/             # 로그인 페이지
│   └── signup/            # 회원가입 페이지
├── components/            # 공통 컴포넌트
│   ├── MainLayout.tsx     # 메인 레이아웃
│   └── Sidebar.tsx        # 네비게이션 사이드바
├── data/
│   └── dummyData.ts       # 더미 데이터 (백엔드 연동 전)
└── types/
    └── index.ts           # TypeScript 타입 정의
```

### 현재 상태

✅ **완료된 기능**:
- 모든 페이지 UI 구현 완료
- 네비게이션 시스템 완성
- 폼 검증 및 상태 관리
- 반응형 디자인 적용
- 권한별 접근 제어 UI
- 이미지 업로드 인터페이스
- 인라인 편집 기능 (관리자 이름)

⏳ **백엔드 연동 대기**:
- API 호출 로직 구현
- 실제 데이터베이스 연동
- 이미지 파일 업로드 처리
- JWT 토큰 기반 인증

## 📚 문서

- [API 연동 가이드](./API_INTEGRATION_GUIDE.md): 백엔드 API 연동 방법
- [컴포넌트 가이드](./COMPONENT_GUIDE.md): UI 컴포넌트 사용법
- [배포 가이드](./DEPLOYMENT_GUIDE.md): 프로덕션 배포 방법

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint

# 타입 체크
npx tsc --noEmit
```

## 🎨 UI/UX 특징

- **일관된 디자인**: Ant Design 컴포넌트 기반 통일된 UI
- **반응형 레이아웃**: 모바일/태블릿/데스크톱 지원
- **직관적 네비게이션**: 좌측 사이드바와 브레드크럼
- **실시간 피드백**: 성공/에러 메시지 및 로딩 상태
- **접근성 고려**: 키보드 네비게이션 및 스크린리더 지원

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**개발 완료**: 프론트엔드 개발이 완료되었습니다. 백엔드 연동을 위한 가이드 문서를 참고해주세요.
