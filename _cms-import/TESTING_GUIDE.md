# D4P-CMS 테스트 가이드

## 📚 목차
1. [테스트 개요](#테스트-개요)
2. [테스트 실행 방법](#테스트-실행-방법)
3. [테스트 종류](#테스트-종류)
4. [작성된 테스트 목록](#작성된-테스트-목록)
5. [테스트 작성 가이드](#테스트-작성-가이드)
6. [문제 해결](#문제-해결)

---

## 테스트 개요

D4P-CMS 프로젝트는 다음과 같은 테스트 전략을 사용합니다:

- **단위 테스트 (Unit Tests)**: 개별 함수와 로직 테스트
- **통합 테스트 (Integration Tests)**: 여러 모듈 간의 상호작용 테스트
- **E2E 테스트 (End-to-End Tests)**: 실제 사용자 시나리오 테스트

### 사용하는 도구
- **Jest**: 단위/통합 테스트 프레임워크
- **React Testing Library**: React 컴포넌트 테스트
- **Playwright**: E2E 테스트 프레임워크

---

## 테스트 실행 방법

### 📦 설치

테스트 의존성이 이미 설치되어 있습니다. 새로운 환경에서 시작하는 경우:

\`\`\`bash
npm install
\`\`\`

### 🧪 단위/통합 테스트 실행

\`\`\`bash
# 모든 단위/통합 테스트 실행
npm test

# Watch 모드로 실행 (개발 중)
npm run test:watch

# 커버리지 리포트와 함께 실행
npm run test:coverage
\`\`\`

### 🌐 E2E 테스트 실행

\`\`\`bash
# E2E 테스트 실행 (개발 서버 자동 시작)
npm run test:e2e

# UI 모드로 실행 (디버깅용)
npm run test:e2e:ui
\`\`\`

**참고:** E2E 테스트는 개발 서버를 자동으로 시작합니다. 수동으로 서버를 실행할 필요 없습니다.

---

## 테스트 종류

### 1. 단위 테스트 (Unit Tests)

**위치:** \`__tests__/unit/\`

개별 함수와 유틸리티를 테스트합니다.

**예시:**
\`\`\`typescript
// __tests__/unit/lib/api.test.ts
describe('apiGet', () => {
  it('GET 요청을 올바르게 수행해야 합니다', async () => {
    // 테스트 코드
  })
})
\`\`\`

### 2. 통합 테스트 (Integration Tests)

**위치:** \`__tests__/integration/\`

여러 모듈이 함께 작동하는 것을 테스트합니다.

**예시:**
\`\`\`typescript
// __tests__/integration/auth-flow.test.tsx
describe('Authentication Flow', () => {
  it('로그인 플로우가 정상 작동해야 합니다', async () => {
    // 테스트 코드
  })
})
\`\`\`

### 3. API 테스트 (API Tests)

**위치:** \`__tests__/api/\`

API Routes를 테스트합니다.

**예시:**
\`\`\`typescript
// __tests__/api/auth.test.ts
describe('POST /api/auth/login', () => {
  it('유효한 자격 증명으로 로그인 가능해야 합니다', async () => {
    // 테스트 코드
  })
})
\`\`\`

### 4. E2E 테스트 (E2E Tests)

**위치:** \`__tests__/e2e/\`

실제 브라우저에서 사용자 시나리오를 테스트합니다.

**예시:**
\`\`\`typescript
// __tests__/e2e/login.spec.ts
test('마스터 계정으로 로그인이 가능해야 합니다', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/이메일/i).fill('design4public@gmail.com')
  // ...
})
\`\`\`

---

## 작성된 테스트 목록

### ✅ 단위 테스트

#### `__tests__/unit/lib/api.test.ts` (7개)
- ✅ GET 요청 수행
- ✅ 쿼리 파라미터 포함
- ✅ Authorization 헤더 포함
- ✅ 에러 처리
- ✅ POST 요청 수행
- ✅ PUT 요청 수행
- ✅ DELETE 요청 수행

### ✅ 통합 테스트

#### `__tests__/integration/auth-flow.test.tsx` (11개)
- ✅ 로그인 성공
- ✅ 로그인 실패 처리
- ✅ 회원가입 성공
- ✅ 회원가입 실패 처리
- ✅ 로그아웃 처리
- ✅ 토큰 제거
- ✅ 마스터 권한 체크
- ✅ 관리자 권한 체크
- ✅ 콘텐츠매니저 권한 체크
- ✅ 토큰 저장
- ✅ 토큰 포함 확인

### 🔄 API 테스트 (개선 필요)

#### `__tests__/api/auth.test.ts`
- ⚠️ Route Handler 테스트 (E2E로 대체 권장)

#### `__tests__/api/projects.test.ts`
- ⚠️ Supabase RPC 모킹 복잡 (E2E로 대체 권장)

### ✅ E2E 테스트

#### `__tests__/e2e/login.spec.ts` (6개)
- ✅ 로그인 페이지 로드
- ✅ 입력 필드 표시
- ✅ 빈 폼 검증
- ✅ 이메일 형식 검증
- ✅ 마스터 계정 로그인
- ✅ 잘못된 자격 증명 처리

#### `__tests__/e2e/navigation.spec.ts` (7개)
- ✅ 모든 메뉴 표시
- ✅ 프로젝트 페이지 이동
- ✅ 아이템 페이지 이동
- ✅ 브랜드 페이지 이동
- ✅ 태그 페이지 이동
- ✅ 관리자 페이지 이동
- ✅ 로그아웃 처리

---

## 테스트 작성 가이드

### 단위 테스트 작성

\`\`\`typescript
// __tests__/unit/lib/myFunction.test.ts
import { myFunction } from '@/lib/myFunction'

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })
})
\`\`\`

### E2E 테스트 작성

\`\`\`typescript
// __tests__/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should work as expected', async ({ page }) => {
    await page.goto('/my-page')
    await expect(page.getByText('Expected Text')).toBeVisible()
  })
})
\`\`\`

### 테스트 네이밍 규칙

1. **파일명**: `*.test.ts` (단위/통합), `*.spec.ts` (E2E)
2. **describe 블록**: 테스트 대상을 명확히 설명
3. **it/test 블록**: "~해야 합니다" 형식으로 작성

**예시:**
\`\`\`typescript
describe('API 유틸리티 함수', () => {
  describe('apiGet', () => {
    it('GET 요청을 올바르게 수행해야 합니다', () => {
      // ...
    })
  })
})
\`\`\`

---

## 문제 해결

### Jest 테스트 실패

**문제:** \`Cannot find module '@/...' \`

**해결:**
\`\`\`bash
# tsconfig.json의 paths 설정 확인
# jest.config.js의 moduleNameMapper 확인
\`\`\`

**문제:** \`localStorage is not defined\`

**해결:** \`jest.setup.js\`에서 이미 모킹되어 있습니다.

### Playwright 테스트 실패

**문제:** \`Timeout exceeded\`

**해결:**
\`\`\`typescript
// timeout 늘리기
await page.waitForSelector('.my-element', { timeout: 10000 })

// 또는 전역 설정
test.setTimeout(60000)
\`\`\`

**문제:** \`개발 서버가 시작되지 않음\`

**해결:**
\`\`\`bash
# 수동으로 개발 서버 시작
npm run dev

# 다른 터미널에서 E2E 테스트 실행
npm run test:e2e
\`\`\`

### 일반적인 문제

**문제:** \`테스트가 간헐적으로 실패\`

**해결:**
1. 비동기 처리 확인 (\`await\` 누락)
2. 테스트 간 독립성 확인 (공유 상태 제거)
3. 타이밍 이슈 확인 (\`waitFor\` 사용)

---

## CI/CD 통합

### GitHub Actions 예시

\`\`\`yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
\`\`\`

---

## 테스트 커버리지

현재 테스트 커버리지:
- **lib/api.ts**: 100% ✅
- **contexts/AuthContext.tsx**: ~90% ✅
- **app/api/** (Route Handlers): E2E로 테스트 ⚠️
- **components/**: E2E로 테스트 ⚠️

목표 커버리지: **80% 이상**

커버리지 확인:
\`\`\`bash
npm run test:coverage
\`\`\`

---

## 추가 리소스

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 공식 문서](https://playwright.dev/)
- [Next.js 테스팅 가이드](https://nextjs.org/docs/testing)

---

## 다음 단계

### Phase 2 테스트 작성
1. 파일 업로드 테스트
2. 이미지 관리 테스트
3. 프로젝트/아이템/브랜드 CRUD 테스트

### Phase 3 테스트 작성
1. 성능 테스트
2. 접근성 테스트
3. 보안 테스트

---

**질문이나 문제가 있으면 Issue를 생성하거나 팀에 문의하세요.**
