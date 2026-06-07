# Design4Public CMS - 배포 가이드

## 📋 개요
이 문서는 D4P-CMS 프로젝트의 배포 과정을 설명합니다.

## 🛠️ 환경 설정

### 개발 환경 요구사항
- **Node.js**: v18 이상
- **npm/yarn/pnpm/bun**: 패키지 매니저
- **TypeScript**: v5 이상

### 환경 변수 설정
프로젝트 루트에 환경변수 파일을 생성하세요:

```bash
# .env.local (개발환경)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:8080/upload
NEXT_PUBLIC_ENV=development

# .env.production (프로덕션)
NEXT_PUBLIC_API_BASE_URL=https://api.d4p-cms.com/api
NEXT_PUBLIC_UPLOAD_URL=https://api.d4p-cms.com/upload
NEXT_PUBLIC_ENV=production
```

## 🏗️ 빌드 과정

### 1. 의존성 설치
```bash
npm install
# 또는
yarn install
# 또는
pnpm install
# 또는
bun install
```

### 2. 타입 체크
```bash
npx tsc --noEmit
```

### 3. 린트 검사
```bash
npm run lint
# 또는
yarn lint
```

### 4. 빌드 실행
```bash
npm run build
# 또는
yarn build
```

### 5. 빌드 결과 확인
```bash
npm run start
# 또는
yarn start
```

## 🚀 배포 옵션

### Option 1: Vercel (권장)

Next.js 프로젝트에 최적화된 플랫폼입니다.

#### 자동 배포 설정
1. GitHub에 코드 푸시
2. Vercel 계정 연결
3. 프로젝트 import
4. 환경변수 설정
5. 자동 배포 완료

#### 환경변수 설정 (Vercel)
```bash
# Vercel Dashboard > Settings > Environment Variables
NEXT_PUBLIC_API_BASE_URL=https://api.d4p-cms.com/api
NEXT_PUBLIC_UPLOAD_URL=https://api.d4p-cms.com/upload
NEXT_PUBLIC_ENV=production
```

#### 도메인 설정
```bash
# vercel.json
{
  "redirects": [
    {
      "source": "/dashboard",
      "destination": "/projects",
      "permanent": true
    }
  ]
}
```

### Option 2: Docker 배포

#### Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://backend:8080/api
      - NEXT_PUBLIC_UPLOAD_URL=http://backend:8080/upload
    depends_on:
      - backend
  
  backend:
    # 백엔드 서비스 설정
    ports:
      - "8080:8080"
```

### Option 3: 정적 배포 (Static Export)

API 서버가 별도로 있는 경우:

#### next.config.js 수정
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

#### 빌드 및 배포
```bash
npm run build
# out 폴더가 생성됨
# 이 폴더를 웹 서버에 업로드
```

## 🔒 보안 설정

### Content Security Policy
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      }
    ]
  }
}
```

### 환경변수 보안
```bash
# .env.local에만 민감한 정보 저장
# NEXT_PUBLIC_으로 시작하는 변수는 클라이언트에 노출됨
# 서버 전용 변수는 NEXT_PUBLIC_ 접두사 없이 사용
```

## 📊 성능 최적화

### 이미지 최적화
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  }
}
```

### 번들 분석
```bash
# 번들 크기 분석
npm install --save-dev @next/bundle-analyzer

# package.json에 스크립트 추가
"analyze": "cross-env ANALYZE=true next build"

# 실행
npm run analyze
```

### 캐싱 전략
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## 🔍 모니터링 및 디버깅

### 에러 추적
```javascript
// 프로덕션에서 에러 로깅
if (process.env.NODE_ENV === 'production') {
  // Sentry, LogRocket 등 에러 추적 서비스 연동
}
```

### 성능 모니터링
```bash
# Lighthouse CI 설정
npm install --save-dev @lhci/cli

# lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm start',
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## 🚦 배포 체크리스트

### 배포 전 확인사항
- [ ] 모든 타입 에러 해결
- [ ] 린트 에러 해결
- [ ] 테스트 통과
- [ ] 환경변수 설정 완료
- [ ] API 엔드포인트 확인
- [ ] 이미지 경로 확인
- [ ] 브라우저 호환성 테스트
- [ ] 모바일 반응형 확인
- [ ] 성능 최적화 완료

### 배포 후 확인사항
- [ ] 모든 페이지 정상 작동
- [ ] API 연동 정상 작동
- [ ] 파일 업로드 기능 정상
- [ ] 인증/권한 시스템 정상
- [ ] 에러 페이지 정상 표시
- [ ] SEO 메타태그 설정
- [ ] 사이트맵 생성
- [ ] 로봇.txt 설정

## 🔄 CI/CD 설정

### GitHub Actions 예시
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type check
      run: npx tsc --noEmit
    
    - name: Run linter
      run: npm run lint
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 📞 지원 및 문의

배포 과정에서 문제가 발생하면:
1. 빌드 로그 확인
2. 브라우저 콘솔 에러 확인
3. 네트워크 탭에서 API 호출 확인
4. 환경변수 설정 재확인

---

성공적인 배포를 위해 이 가이드의 모든 단계를 순서대로 진행해주세요.