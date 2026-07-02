# design4public 통합 설계 (Unified Repo Design)

날짜: 2026-07-03
상태: 초안 — 사용자 승인 대기

## 1. 목표 / 비목표

**목표**
1. `design4public-frontend`(서비스 사이트) + `d4p-cms`(관리자)를 하나의 레포·하나의 Next.js 앱·하나의 Vercel 프로젝트로 통합
2. "관리자에서 변경 → 사이트 미반영" 버그 근본 해결 (on-demand revalidation)
3. SEO 최적화 (구조화 데이터, 사진 상세 페이지, 사이트맵 보강)
4. 검색 강화: pgvector + 한국어 친화 키워드 검색 하이브리드(RRF) — 프로젝트/아이템/사진 통합 검색
5. E2E 테스트 체계 구축 (로컬 Supabase Docker, 프로덕션 DB 무접근)
6. 유지보수 하네스 최적화 (CLAUDE.md, stale 문서 정리, supabase CLI 마이그레이션 체계)

**확장 목표 (사용자 지시로 이번 라운드 포함 — 후반 마일스톤)**
7. 데이터 모델 정합성: 프로젝트-아이템 연결을 직접(project_items)에서 파생(프로젝트→사진→아이템)으로 전환 + CMS 태깅 UI
8. Next 15 / React 19 업그레이드 (통합 안정화 후)
9. supabaseAdmin(RLS 우회) → RLS 기반 접근 리팩토링
10. 이미지 임베딩(CLIP/멀티모달) — 검색 2단계
11. 마이그레이션 020 (레거시 이미지 스토어 DROP) 프로덕션 적용 — 백업+검증 게이트 뒤
12. 디자인 시스템 내부 정리 — 시각 결과 불변 전제로 inline style/.d4p-* → Tailwind v4 토큰 점진 전환 (공개 사이트 룩앤필 변경은 범위 밖)

## 2. 확정된 결정

| 결정 | 내용 |
|---|---|
| 아키텍처 | 단일 Next.js 앱, 관리자 = `/admin` 라우트 |
| 검색 | pgvector + 키워드 하이브리드, RRF 결합, additive 마이그레이션만 |
| E2E | 로컬 Supabase (Docker, supabase CLI) |
| 레포 | `leejonver/design4public` 재사용, CMS는 git subtree로 히스토리 보존 병합 |
| Tailwind | v4로 통일 (CMS가 이미 v4 + vapor-ui 레이어; 프론트 v3.4 → v4 마이그레이션) |
| Next/React | 14.2.x / 18.3.x 로 정렬 (프론트 14.2.5 → 14.2.32) |

## 3. 디렉토리 구조 (통합 후)

```
design4public/
├── app/
│   ├── (site)/                  # 공개 사이트 (기존 frontend app/)
│   │   ├── layout.tsx           # site CSS import, SiteHeader/Footer
│   │   ├── page.tsx, projects/, items/, brands/, photos/, privacy/, terms/
│   │   └── photos/[id]/         # 신규: 사진 상세 (SEO)
│   ├── admin/                   # 관리자 (기존 d4p-cms src/app/)
│   │   ├── layout.tsx           # vapor ThemeProvider + admin CSS import
│   │   ├── login/, signup/, projects/, items/, brands/, photos/,
│   │   │   categories/, managers/, home-settings/
│   ├── api/
│   │   ├── inquiry/             # 사이트 문의 (기존)
│   │   ├── search/              # 신규: 하이브리드 검색 엔드포인트
│   │   └── admin/               # CMS API 전체 이동 (auth/, projects/, items/, ..., upload/)
│   ├── sitemap.ts, robots.ts, opengraph-image.tsx, layout.tsx(root)
├── components/
│   ├── site/                    # 기존 components/d4p/*
│   ├── admin/                   # 기존 CMS components
│   └── ui/                      # shadcn (site 전용)
├── lib/
│   ├── supabase/                # browser.ts, server.ts(ssr), admin.ts(service-role)
│   ├── data/                    # 사이트 읽기 쿼리 (기존 lib/api.ts) + CMS dto.ts
│   ├── search/                  # 임베딩 생성, 하이브리드 검색 클라이언트
│   ├── revalidation.ts          # 신규: 태그/경로 revalidate 헬퍼
│   ├── auth.ts, image-sync.ts, seo.ts, types.ts
│   └── database.types.ts        # supabase gen types — 단일 소스, 자동 생성
├── supabase/                    # 신규: supabase CLI 프로젝트
│   ├── config.toml
│   ├── migrations/              # baseline(프로덕션 스키마 pull) + 신규 additive
│   └── seed.sql                 # E2E 시드 데이터
├── middleware.ts                # matcher: ['/admin/:path*'] 만
├── tests/
│   ├── e2e/                     # Playwright: site/, admin/, integration/
│   └── unit/                    # 기존 jest(CMS) + vitest(frontend) → vitest 통일
├── docs/                        # 살아있는 문서만 (stale 문서 삭제)
└── CLAUDE.md                    # 통합 하네스 문서
```

- CMS 유닛테스트(jest 60개)는 vitest로 이관 (둘 다 jsdom, 문법 거의 동일 — 러너 1개 유지).
- 스타일 격리: `(site)/layout.tsx`가 site CSS, `admin/layout.tsx`가 vapor CSS를 import — Next가 세그먼트별로 CSS 로드. CSS 변수 프리픽스 충돌 없음(`--ink/--sp/--sage` vs vapor 토큰).

## 4. Revalidation 설계 (핵심 버그 수정)

현황: 사이트 전 페이지 `revalidate = 3600` (1시간 ISR), on-demand revalidation 0개. CMS는 별도 앱이라 신호 보낼 방법 자체가 없었음.

설계 (단일 앱이라 직접 호출 가능):
- `lib/revalidation.ts`: `revalidateEntity(type, slug?)` 헬퍼 — 엔티티별 영향 경로 매핑:
  - project 변경 → `/`, `/projects`, `/projects/[slug]`, `/photos`, `/sitemap.xml`
  - item 변경 → `/`, `/items`, `/items/[slug]`, 연결된 project 상세
  - brand / photo / category / site_settings / home_featured → 해당 경로들
- 모든 `/api/admin/*` mutation 핸들러 성공 시 `revalidatePath()` 호출 (Node 런타임, 같은 앱이므로 시크릿/웹훅 불필요)
- `revalidate = 3600` 은 백스톱으로 유지
- E2E 통합 테스트로 검증: "admin에서 프로젝트 수정 → 사이트에서 즉시 보임" (원래 버그 시나리오 재현 테스트)

## 5. 인증 / 미들웨어 / 보안

- middleware matcher `['/admin/:path*']` — 공개 사이트 절대 미간섭. 로그인 리다이렉트는 `/admin/login`으로
- CMS API → `/api/admin/*` 이동, 각 핸들러의 `requireRole` 유지. 라우트 핸들러는 middleware 밖이므로 기존과 동일하게 핸들러 내부 검사 유지
- `vercel.json`의 와일드카드 CORS(`*`) 제거 — 같은 오리진이 됨. function maxDuration/memory 설정은 `/api/admin/*`에만 유지
- **RLS 수리 (additive, 데이터 무손상)**:
  - `projects`/`profiles`/`inquiries` RLS 상태를 프로덕션에서 실사 후 baseline에 기록, 누락 시 정책 추가
  - draft/hidden 프로젝트 사진 공개 노출 회귀(009 의도 유실) → `project_photos`/`photos` SELECT 정책 보강. 단, CMS는 service-role이라 무영향, 사이트 쿼리는 published만 조회 중이라 UI 변화 없음
- `SUPABASE_SERVICE_ROLE_KEY`는 `lib/supabase/admin.ts`(`server-only`) 안에만 — 기존 패턴 유지

## 6. Vercel / 도메인 / 배포

1. `design4public` Vercel 프로젝트 유지 (도메인 `design4public.com`, `www.` 그대로)
2. env 추가: `SUPABASE_SERVICE_ROLE_KEY`, (신규) `OPENAI_API_KEY`. 폐기: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_UPLOAD_URL`, `NEXT_PUBLIC_ENV`
3. 프리뷰 배포로 전체 QA → 프로덕션 승격
4. 컷오버: `cms.design4public.com` 도메인을 d4p-cms 프로젝트에서 분리 → design4public 프로젝트에 추가, `/admin`으로 리다이렉트 (next.config redirects)
5. 검증 기간(1~2주) 후 d4p-cms Vercel 프로젝트 pause/삭제, GitHub 레포 아카이브

## 7. 검색 설계 (pgvector 하이브리드)

**스키마 (additive만):**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('project','item','photo','brand')),
  entity_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',        -- 검색 대상 텍스트 (설명+태그+카테고리+연결엔티티명)
  embedding vector(1536),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);
-- GIN trigram 인덱스 (한국어 부분일치), HNSW 벡터 인덱스
-- hybrid_search(query, query_embedding, limit) RPC: trigram/ILIKE 랭킹 + cosine 유사도 → RRF 결합
```
기존 테이블 변경 zero. `search_index`는 파생 데이터 — 날려도 재빌드 가능.

**한국어 키워드 매칭**: Postgres 기본 FTS는 한국어 형태소 분석 불가 → `pg_trgm` trigram 유사도 + ILIKE 랭킹 사용 (Supabase 지원, 한국어 부분일치에 실효적). 벡터 검색이 의미 매칭을 보완.

**임베딩 파이프라인**:
- 모델: OpenAI `text-embedding-3-small` (1536d, 다국어 OK, 저비용) — `OPENAI_API_KEY` 필요
- 쓰기 경로: CMS mutation 성공 시 `search_index` upsert + 임베딩 생성 (실패해도 mutation은 성공 처리, 재시도 가능한 backfill로 보정)
- 백필: 전체 엔티티 1회 스크립트 (기존 데이터 ~83 프로젝트, 22 아이템 + 사진 — 비용 무시 가능 수준)
- 사진: title + alt_text + description + 연결된 프로젝트/아이템 이름을 body로

**읽기 경로**: `/api/search?q=` → 쿼리 임베딩 생성 → `hybrid_search` RPC → 타입별 그룹 결과. 헤더 검색(BrandSearch)을 이 엔드포인트로 교체(debounce), `/search` 전체 결과 페이지 신설. 기존 `q` 파라미터 미배선 버그도 함께 수리.

## 7-1. 데이터 모델 정합성 (프로젝트-사진-아이템-브랜드)

**목표 모델**: 프로젝트-아이템은 직접 연결이 아니라 "프로젝트에 속한 사진(project_photos)에 태깅된 아이템(photo_items)"으로 파생. 브랜드는 아이템의 속성(items.brand_id).

**프로덕션 실태 (2026-07-03 읽기전용 감사)**:
- `project_items` 직접 연결 25쌍, 파생 가능 연결 **0쌍**
- `photo_items` 29행은 전부 아이템 갤러리 용도 (해당 사진들이 project_photos에 없음)
- → 현재 CMS/데이터는 전부 구모델. 신모델 전환에 CMS UI 신설 + 콘텐츠 재태깅 필요

**전환 설계 (데이터 무손실, 3단계)**:
1. **CMS UI**: 프로젝트 편집 화면의 사진 관리에 사진별 아이템 태깅 추가 (photo_items upsert, 프로젝트 문맥에서). 기존 직접 아이템 연결 UI는 "레거시 연결" 읽기전용으로 강등 + 재태깅 필요 뱃지. 사진 편집 화면의 아이템 연결 기능은 유지(동일 photo_items).
2. **사이트**: 프로젝트 상세 관련아이템 / 아이템 상세 관련프로젝트를 파생 쿼리로 전환하되, 과도기에는 직접∪파생 합집합 표시 (재태깅 전 회귀 방지). 검색 인덱스 body도 동일 규칙.
3. **폐기**: 25쌍 재태깅 완료 확인(감사 스크립트 재실행 = 직접⊆파생) 후 별도 라운드에서 project_items 참조 제거 + 테이블 DROP (2단계 destructive 규칙). 이번 라운드에서는 DROP 안 함.

**감사 도구**: `scripts/audit-relations.mjs` — 직접 vs 파생 비교 리포트, CMS 대시보드/CLI에서 재태깅 진행률 확인용. 고아 데이터(연결 없는 사진, 브랜드 없는 아이템, published 프로젝트의 대표사진 부재 등) 점검 포함.

## 8. SEO 설계

1. `/photos/[id]` 상세 페이지 구현 (현재 빈 stub) — 이미지 SEO + 사진 검색 유입, sitemap 포함
2. JSON-LD 확충: item → `Product`, project → `Article` + `ImageObject`, 전 상세페이지 `BreadcrumbList` (헬퍼 이미 존재, 미사용 — 배선만)
3. sitemap에 photos 추가, `lastModified` 정확화
4. `app/manifest.ts` 추가
5. 메타데이터 기존 체계(`createPageMetadata`) 유지 — 이미 양호
6. seo-aeo-best-practices 스킬 기준 구현 검수

## 9. E2E / QA 설계

**환경**: supabase CLI 로컬 스택 (Docker). baseline 마이그레이션 = 프로덕션 스키마 `supabase db pull` (스키마만, 데이터 없음 — 프로덕션은 읽기 전용 1회 접근). `seed.sql`로 결정적 테스트 데이터. **프로덕션 DB에 테스트가 접근할 경로 자체가 없음.**

**Playwright 스위트**:
- `site/`: 홈 렌더+큐레이션, 목록/필터, 상세 3종, 사진 그리드+라이트박스, 검색(헤더+전체페이지), 문의 폼, sitemap/robots/JSON-LD 존재 검증
- `admin/`: 로그인/로그아웃/미인증 리다이렉트, 프로젝트/아이템/브랜드/사진 CRUD 풀사이클, 이미지 업로드, 카테고리/태그, home-settings, 권한(RBAC) 시나리오
- `integration/`: **admin 수정 → 사이트 즉시 반영** (revalidation 검증 — 원버그 회귀 테스트), 검색 인덱스 갱신 검증
- 유닛: 기존 CMS jest 60개 vitest 이관 + 프론트 빈 스위트 재건 (revalidation 매핑, 검색 RRF, dto)

**CI (GitHub Actions)**: lint + typecheck + vitest + supabase local + playwright. PR마다 실행.

## 10. 하네스 최적화

1. 통합 CLAUDE.md: 아키텍처 지도, 명령어, 마이그레이션 규칙(additive-only, 2단계 destructive), revalidation 규칙, E2E 실행법
2. stale 문서 삭제: `context.md`, `API_INTEGRATION_GUIDE.md`, `DEPLOYMENT_GUIDE.md`(가상 백엔드 서술), 구 `API guide.md`, stale `database.types.ts` 2벌 → `supabase gen types` 1벌 + npm script
3. `.gitignore` 정비 (`tsconfig.tsbuildinfo`, `.claude/`, `.playwright-mcp/`, `playwright-report/` 등)
4. dead code 제거: `/api/auth/login`(미사용), `addCacheBuster`(미호출), stale env vars

## 11. 실행 순서 (마일스톤)

| # | 마일스톤 | 게이트 |
|---|---|---|
| 0 | 안전장치: 프로덕션 DB 전체 백업(supabase db dump), 양 레포 태그, 프론트 미커밋분 정리, gh 계정 전환(완료) | 백업 파일 확인 |
| 1 | 레포 병합 + 구조 재배치 + Tailwind v4 통일 + 로컬 빌드/기존 테스트 통과 | `next build` 성공 |
| 2 | Revalidation 구현 | 통합 E2E 통과 |
| 3 | 로컬 Supabase + E2E 하네스 + 시드 + CI | 전 스위트 그린 |
| 4 | 데이터 모델 정합성: 감사 스크립트 + CMS 사진-아이템 태깅 UI + 사이트 파생 쿼리(합집합) | 관계 E2E 통과 |
| 5 | SEO | Lighthouse/스키마 검증 |
| 6 | 검색 1단계 (마이그레이션→텍스트 임베딩 백필→API→UI) | 검색 E2E 통과 |
| 7 | 프리뷰 배포 전체 QA → 프로덕션 컷오버 → 도메인 이전 → 구 프로젝트 아카이브 | 프로덕션 스모크 테스트 |
| 8 | RLS 리팩토링: supabaseAdmin 최소화, DB 레벨 권한 백스톱 | 전 E2E 그린 + 프리뷰 검증 |
| 9 | Next 15 / React 19 업그레이드 (codemod + vapor-ui 호환 확인) | 전 E2E 그린 |
| 10 | 검색 2단계: CLIP 이미지 임베딩 (사진 내용 자체 검색) | 검색 품질 평가 |
| 11 | 마이그레이션 020 적용 (레거시 이미지 스토어 DROP) — 백업 재확인 + 검증 스크립트 통과 후 | verify 스크립트 PASS |
| 12 | 디자인 시스템 내부 정리 (시각 불변, 스크린샷 회귀 테스트로 보증) + 하네스/문서 | 스크린샷 diff zero |

컷오버(7)를 중간에 배치: 통합+버그수정+검색이 사용자 가치 핵심이라 먼저 배포, 8~12는 배포된 단일 레포 위에서 진행. 각 마일스톤 = 별도 브랜치/PR, 서브에이전트(opus/sonnet) + codex 위임, Fable은 오케스트레이션만.

## 12. 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| 프로덕션 DB 손상 | 컷오버(마일스톤 7)까지 DB 변경 = additive만(search_index, 확장, RLS 정책 추가). 유일한 destructive는 마일스톤 11의 020 적용 — 직전 재백업 + verify_image_migration 통과 + 사용자 명시 승인 게이트. 사전 전체 백업. 마이그레이션은 로컬 → 프리뷰 검증 후 프로덕션 |
| Tailwind v3→v4 시각 회귀 | 프론트 스타일 대부분 globals.css 커스텀(영향 소); Playwright 스크린샷 비교로 검증 |
| CSS/토큰 충돌 | 세그먼트별 CSS import + 프리픽스 상이 확인됨. E2E에서 양쪽 렌더 검증 |
| RLS 정책 변경으로 사이트 데이터 안 보임 | 정책 추가 전후 프리뷰에서 전 페이지 E2E, published 데이터 가시성 확인 |
| 도메인 컷오버 다운타임 | 프리뷰 QA 완료 후 이전, cms 도메인은 리다이렉트만이라 무중단 |
| 임베딩 비용/키 부재 | 데이터 소규모(수백 행). OPENAI_API_KEY 필요 — 사용자 제공 필요 |
