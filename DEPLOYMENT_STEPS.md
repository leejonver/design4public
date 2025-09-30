# D4P-CMS 배포 가이드 (Vercel)

**프로젝트:** Design4Public CMS  
**배포 플랫폼:** Vercel (권장)  
**작성일:** 2025-09-30

---

## 🚀 배포 상태

✅ **코드 커밋 완료**
- Commit: `8dce7af`
- Branch: `main`
- GitHub: https://github.com/leejonver/d4p-cms

✅ **빌드 성공 확인**
- TypeScript: 에러 없음
- Next.js 빌드: 성공
- 24개 페이지 생성

✅ **Supabase 설정 완료**
- 환경 변수 설정됨
- 데이터베이스 준비됨

---

## 📋 배포 옵션

### 🌟 Option 1: Vercel (권장 - 가장 쉬움)

**장점:**
- Next.js에 최적화
- 자동 빌드 및 배포
- 무료 플랜 사용 가능
- GitHub 연동 자동화
- 환경 변수 관리 편리

**예상 시간:** 10분

#### 1단계: Vercel 프로젝트 생성

1. **Vercel 웹사이트 접속**
   - https://vercel.com
   - GitHub 계정으로 로그인

2. **새 프로젝트 Import**
   ```
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택: leejonver/d4p-cms
   - Import 클릭
   ```

3. **프로젝트 설정**
   ```
   Framework Preset: Next.js (자동 감지됨)
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

#### 2단계: 환경 변수 설정

**중요:** Vercel Dashboard에서 환경 변수를 추가하세요.

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Next.js 설정 (선택)
NEXT_PUBLIC_ENV=production
```

**환경 변수 추가 방법:**
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. 각 변수 추가
4. Environment: Production, Preview, Development 모두 선택

#### 3단계: 배포 실행

```
- "Deploy" 버튼 클릭
- 자동으로 빌드 및 배포 시작
- 약 2-3분 소요
```

#### 4단계: 배포 확인

```
배포 완료 후:
- Vercel이 자동으로 URL 생성 (예: d4p-cms.vercel.app)
- "Visit" 버튼 클릭하여 사이트 접속
- 로그인 페이지로 리다이렉트되는지 확인
```

#### 5단계: 도메인 설정 (선택)

**커스텀 도메인 연결:**
```
1. Vercel Dashboard → Settings → Domains
2. 도메인 추가 (예: cms.design4public.com)
3. DNS 설정 (Vercel이 가이드 제공)
4. SSL 인증서 자동 발급
```

---

### Option 2: Netlify

**장점:**
- 무료 플랜 제공
- 빌드 플러그인 풍부
- 폼 처리 기능 내장

**예상 시간:** 15분

#### 배포 단계:

1. **Netlify 사이트 접속**
   ```
   https://netlify.com
   GitHub 로그인
   ```

2. **새 사이트 추가**
   ```
   "Add new site" → "Import an existing project"
   GitHub 저장소 선택: leejonver/d4p-cms
   ```

3. **빌드 설정**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **환경 변수 설정**
   ```
   Site settings → Environment variables
   Supabase 환경 변수 추가
   ```

5. **배포 실행**
   ```
   "Deploy site" 클릭
   ```

---

### Option 3: Docker + 클라우드 (고급)

**적합한 경우:**
- 자체 서버 운영
- AWS/GCP/Azure 사용
- 완전한 제어 필요

**예상 시간:** 1-2시간

#### Dockerfile (이미 준비됨)

```dockerfile
# 프로젝트 루트에 Dockerfile 생성
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

#### 배포 명령어:

```bash
# 이미지 빌드
docker build -t d4p-cms .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  d4p-cms
```

---

## ✅ 배포 후 체크리스트

### 필수 확인 사항

- [ ] **사이트 접속 가능**
  - 배포된 URL 접속
  - 로그인 페이지가 로드되는지 확인

- [ ] **로그인 테스트**
  - 마스터 계정으로 로그인
  - 프로젝트 페이지 접근 확인

- [ ] **데이터 조회**
  - 프로젝트 목록 조회
  - 데이터가 표시되는지 확인

- [ ] **CRUD 작업 테스트**
  - [ ] 프로젝트 생성
  - [ ] 프로젝트 조회
  - [ ] 프로젝트 수정
  - [ ] 프로젝트 삭제

- [ ] **권한 테스트**
  - 관리자 계정으로 테스트
  - 콘텐츠매니저 계정으로 테스트

### 선택 확인 사항

- [ ] **이미지 업로드**
  - Supabase Storage 설정 확인
  - 이미지 업로드 테스트

- [ ] **검색 기능**
  - 프로젝트 검색
  - 필터링 동작 확인

- [ ] **반응형 디자인**
  - 모바일에서 접속
  - 레이아웃 확인

---

## 🔧 문제 해결

### 문제 1: 빌드 실패

**증상:**
```
Build failed: Module not found
```

**해결책:**
```bash
# 로컬에서 빌드 테스트
npm run build

# 문제가 있으면 의존성 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### 문제 2: 환경 변수 에러

**증상:**
```
Error: Missing environment variable
```

**해결책:**
1. Vercel Dashboard → Settings → Environment Variables 확인
2. 모든 Supabase 환경 변수가 설정되었는지 확인
3. 재배포: Deployments → 최신 배포 → "Redeploy"

---

### 문제 3: 로그인 실패

**증상:**
```
로그인 시 에러 발생
```

**해결책:**
1. **Supabase 확인**
   - Supabase Dashboard → Authentication 확인
   - 사용자 계정이 생성되어 있는지 확인
   
2. **프로필 확인**
   - Supabase → Table Editor → profiles
   - 사용자의 status가 'approved'인지 확인

3. **환경 변수 확인**
   - NEXT_PUBLIC_SUPABASE_URL이 올바른지 확인
   - NEXT_PUBLIC_SUPABASE_ANON_KEY가 올바른지 확인

---

### 문제 4: 데이터 조회 실패

**증상:**
```
프로젝트 목록이 비어있음
또는 "relation does not exist" 에러
```

**해결책:**
1. **테이블 확인**
   - Supabase → Table Editor
   - projects, items, brands, tags 테이블 존재 확인

2. **마이그레이션 실행**
   ```sql
   -- migrations/create_project_with_relations.sql 실행
   ```

3. **RLS 정책 확인**
   - Supabase → Authentication → Policies
   - 읽기 권한이 있는지 확인

---

## 📊 배포 성공 기준

### ✅ 필수 기능 (모두 작동해야 함)

- ✅ 로그인/로그아웃
- ✅ 프로젝트 목록 조회
- ✅ 프로젝트 생성
- ✅ 프로젝트 상세보기
- ✅ 프로젝트 수정
- ✅ 프로젝트 삭제

### 🟡 부가 기능 (선택적)

- 🟡 이미지 업로드 (Supabase Storage 설정 필요)
- 🟡 아이템 관리
- 🟡 브랜드 관리
- 🟡 태그 관리
- 🟡 관리자 관리

---

## 🚀 자동 배포 설정

### GitHub Actions (선택)

**.github/workflows/deploy.yml**

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📞 배포 후 다음 단계

### 1. 모니터링 설정

**Vercel Analytics:**
```
- Vercel Dashboard → Analytics 탭
- 무료 플랜에서도 사용 가능
- 페이지 뷰, 성능 메트릭 확인
```

**Sentry (에러 추적):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 2. 성능 최적화

**Lighthouse 점수 확인:**
```bash
# Chrome DevTools → Lighthouse
# 또는
npm install -g lighthouse
lighthouse https://your-site.vercel.app
```

### 3. 백업 전략

**Supabase 백업:**
```
- Supabase Dashboard → Database → Backups
- 정기 백업 설정
- Point-in-time recovery 활성화
```

---

## 🎉 배포 완료!

축하합니다! D4P-CMS가 성공적으로 배포되었습니다.

**배포된 사이트:**
- URL: https://your-project.vercel.app
- 관리자 접속: https://your-project.vercel.app/login

**다음 단계:**
1. ✅ 마스터 계정으로 로그인
2. ✅ 프로젝트 생성 테스트
3. ✅ 팀원에게 접근 권한 부여
4. ✅ 콘텐츠 추가 시작

**문의사항:**
- GitHub Issues: https://github.com/leejonver/d4p-cms/issues
- 문서: 프로젝트 루트의 `.md` 파일들 참조

---

**배포 완료 일시:** 2025-09-30  
**배포자:** 이재환  
**버전:** v1.0.0 (테스트 인프라 포함)
