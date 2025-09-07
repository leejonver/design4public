# Design4Public CMS - API 연동 가이드

## 📋 개요
이 문서는 프론트엔드가 완성된 D4P-CMS 프로젝트에 백엔드 API를 연동하기 위한 가이드입니다.

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── brands/            # 브랜드 관리
│   │   ├── page.tsx       # 브랜드 목록
│   │   ├── new/page.tsx   # 브랜드 생성
│   │   └── [brand_id]/
│   │       ├── page.tsx   # 브랜드 상세
│   │       └── edit/page.tsx # 브랜드 편집
│   ├── items/             # 아이템 관리
│   │   ├── page.tsx       # 아이템 목록
│   │   ├── new/page.tsx   # 아이템 생성
│   │   └── [item_id]/
│   │       ├── page.tsx   # 아이템 상세
│   │       └── edit/page.tsx # 아이템 편집
│   ├── projects/          # 프로젝트 관리
│   │   ├── page.tsx       # 프로젝트 목록
│   │   ├── new/page.tsx   # 프로젝트 생성
│   │   └── [project_id]/
│   │       ├── page.tsx   # 프로젝트 상세
│   │       └── edit/page.tsx # 프로젝트 편집
│   ├── tags/page.tsx      # 태그 관리
│   ├── managers/page.tsx  # 관리자 관리
│   ├── login/page.tsx     # 로그인
│   └── signup/page.tsx    # 회원가입
├── components/            # 공통 컴포넌트
│   ├── MainLayout.tsx     # 메인 레이아웃
│   └── Sidebar.tsx        # 사이드바
├── data/
│   └── dummyData.ts       # 더미 데이터 (API로 대체 예정)
└── types/
    └── index.ts           # TypeScript 타입 정의
```

## 🔄 API 연동 포인트

### 1. 인증 관련 API

#### 로그인 (`/src/app/login/page.tsx`)
```typescript
// 현재: 더미 로직
const handleLogin = async (values: LoginFormData) => {
  console.log('Login attempt:', values);
  router.push('/projects');
};

// 백엔드 연동 예시
const handleLogin = async (values: LoginFormData) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    
    if (response.ok) {
      const { token, user } = await response.json();
      // JWT 토큰 저장
      localStorage.setItem('authToken', token);
      // 사용자 정보 저장
      setCurrentUser(user);
      router.push('/projects');
    } else {
      message.error('로그인에 실패했습니다.');
    }
  } catch (error) {
    message.error('로그인 중 오류가 발생했습니다.');
  }
};
```

#### 회원가입 (`/src/app/signup/page.tsx`)
```typescript
// API 엔드포인트: POST /api/auth/signup
// 요청 데이터: { email: string, password: string }
```

### 2. 프로젝트 관련 API

#### 프로젝트 목록 (`/src/app/projects/page.tsx`)
```typescript
// 현재: dummyProjects 사용
const [projects, setProjects] = useState(dummyProjects);

// 백엔드 연동 필요
useEffect(() => {
  fetchProjects();
}, []);

const fetchProjects = async () => {
  try {
    const response = await fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setProjects(data.projects);
  } catch (error) {
    message.error('프로젝트 목록을 불러오는데 실패했습니다.');
  }
};
```

#### 프로젝트 생성 (`/src/app/projects/new/page.tsx`)
```typescript
// 현재 handleSubmit 함수 (라인 75-95)
const handleSubmit = async (values: ProjectFormData) => {
  setLoading(true);
  
  try {
    // TODO: API 호출로 변경 필요
    const projectData = {
      ...values,
      tags: selectedTags,
      connectedItems: selectedItems
    };
    
    // 실제 API 호출
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...projectData,
        images: fileList // 파일 업로드 처리 필요
      })
    });

    if (response.ok) {
      message.success('프로젝트가 성공적으로 추가되었습니다!');
      router.push('/projects');
    }
  } catch (error) {
    message.error('프로젝트 추가 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};
```

### 3. 아이템 관련 API

#### 아이템 목록 (`/src/app/items/page.tsx`)
```typescript
// API 엔드포인트: GET /api/items
// 필터링: ?status={status}&search={searchTerm}
```

#### 아이템 생성 (`/src/app/items/new/page.tsx`)
```typescript
// API 엔드포인트: POST /api/items
// 파일 업로드: multipart/form-data 처리 필요
```

### 4. 브랜드 관련 API

#### 브랜드 목록 (`/src/app/brands/page.tsx`)
```typescript
// API 엔드포인트: GET /api/brands
```

#### 브랜드 생성 (`/src/app/brands/new/page.tsx`)
```typescript
// API 엔드포인트: POST /api/brands
// 로고/커버 이미지 업로드 처리 필요
```

### 5. 관리자 관리 API

#### 관리자 목록 및 관리 (`/src/app/managers/page.tsx`)
```typescript
// 관리자 목록: GET /api/managers
// 권한 변경: PUT /api/managers/{id}/role
// 승인 상태 변경: PUT /api/managers/{id}/approval
// 이름 수정: PUT /api/managers/{id}/name
// 삭제: DELETE /api/managers/{id}

// 예시: 관리자 이름 수정 (라인 150-166)
const handleSaveName = async (managerId: string) => {
  if (!editingName.trim()) {
    message.error('이름을 입력해주세요.');
    return;
  }

  try {
    const response = await fetch(`/api/managers/${managerId}/name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: editingName.trim() })
    });

    if (response.ok) {
      // 로컬 상태 업데이트
      setManagers(prevManagers =>
        prevManagers.map(manager =>
          manager.id === managerId
            ? { ...manager, name: editingName.trim(), updatedAt: new Date().toISOString() }
            : manager
        )
      );
      message.success('관리자 이름이 수정되었습니다.');
      setEditingNameId(null);
      setEditingName('');
    }
  } catch (error) {
    message.error('이름 수정 중 오류가 발생했습니다.');
  }
};
```

### 6. 태그 관리 API

#### 태그 CRUD (`/src/app/tags/page.tsx`)
```typescript
// 목록: GET /api/tags
// 생성: POST /api/tags
// 수정: PUT /api/tags/{id}
// 삭제: DELETE /api/tags/{id}
```

## 🔐 인증 및 권한

### JWT 토큰 관리
```typescript
// 토큰 저장
localStorage.setItem('authToken', token);

// API 요청 시 헤더 포함
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
};
```

### 권한 체크
- **마스터**: 모든 기능 접근 가능
- **관리자**: 콘텐츠 관리만 가능
- **콘텐츠매니저**: 제한된 기능만 접근

## 📁 파일 업로드

### 이미지 업로드 처리
```typescript
// 현재: 클라이언트 사이드에서 파일 리스트만 관리
const [fileList, setFileList] = useState<UploadFile[]>([]);

// 백엔드 연동 시
const uploadProps = {
  customRequest: async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      onSuccess(result);
    } catch (error) {
      onError(error);
    }
  }
};
```

## 🎯 데이터 타입 정의

모든 타입이 `/src/types/index.ts`에 정의되어 있습니다:

```typescript
// 주요 인터페이스
export interface Project { /* ... */ }
export interface Item { /* ... */ }
export interface Brand { /* ... */ }
export interface Manager { /* ... */ }
export interface Tag { /* ... */ }

// Form 데이터 타입
export interface ProjectFormData { /* ... */ }
export interface ItemFormData { /* ... */ }
export interface BrandFormData { /* ... */ }
```

## 🔄 상태 관리

현재 로컬 상태로 관리되는 데이터들:
- `useState`로 관리되는 목록 데이터
- 검색/필터 상태
- 편집 모드 상태

백엔드 연동 후 고려사항:
- React Query 또는 SWR 도입 고려
- 캐싱 전략 수립
- 낙관적 업데이트 구현

## 🚨 주의사항

### 1. 더미 데이터 제거
`/src/data/dummyData.ts` 파일의 데이터를 실제 API 호출로 대체해야 합니다.

### 2. 에러 처리
모든 API 호출에 적절한 에러 처리가 포함되어야 합니다.

### 3. 로딩 상태
사용자 경험을 위해 로딩 상태를 적절히 관리해야 합니다.

### 4. 권한 체크
페이지 접근 시 권한 체크 로직이 필요합니다.

## 🛠️ 개발 환경 설정

### 환경 변수 설정 필요
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:8080/upload
```

### 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
# 또는
bun dev
```

## 📚 추가 문서

- [README.md](./README.md): 프로젝트 개요
- [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md): 컴포넌트 가이드
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md): 배포 가이드

---

**연락처**: 프론트엔드 개발 완료 후 질문이나 이슈가 있으시면 언제든 연락 주세요.