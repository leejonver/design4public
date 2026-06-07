# D4P-CMS 리뉴얼 요구사항 (Requirements)

> 본 문서는 **요구사항(무엇을 만족해야 하는가)** 만 정의한다. 작업 순서·일정·실행 절차는 포함하지 않는다.
> 대상 시스템: `d4p-cms` — 공공조달 가구 납품 프로젝트 사례를 관리하는 CMS 관리자 웹앱.

---

## 1. 목표

1. 디자인시스템을 **Ant Design 5 → Vapor UI(구름 디자인시스템) + Tailwind CSS v4** 로 전면 교체한다.
2. **프로젝트 · 아이템 · 브랜드 · 사진 · 태그** 데이터가 무결성 있게 연결되도록 DB 모델 · 데이터 정책 · 동작 로직을 재설계한다.
3. **통합 검색 기능** 을 구현한다.
4. **관리자 사용자 관리 기능** 을 구현한다.

---

## 2. 기술 스택 요구사항

- Next.js 14 (App Router), React 18, TypeScript 5 유지.
- UI: `@vapor-ui/core`, `@vapor-ui/hooks`, `@vapor-ui/icons` 사용. `antd` / `@ant-design/icons` 의존성 0.
- 스타일: Tailwind CSS v4 (CSS-first, `tailwind.config.js` 비의존).
- 백엔드: Supabase (Auth, PostgREST, Storage) 유지.
- 인증: `@supabase/ssr` 기반 쿠키 세션. localStorage 토큰 의존 제거.
- 서체: Pretendard 유지.
- 데스크탑 최적화 + 반응형 유지.

---

## 3. 정합화 필수 대상 (현재 구조 부채)

리뉴얼 결과물에서 아래 불일치는 반드시 해소되어야 한다.

| 항목 | 현재 상태 | 요구 결과 |
| --- | --- | --- |
| 권한값 | 타입 `content_manager` ↔ DB `profiles.role`=`general` | 전 계층 `master \| admin \| content_manager` 로 통일 |
| 아이템 상태값 | 타입 `available\|discontinued\|hidden` ↔ `Database` `available\|unavailable\|discontinued` | `available \| discontinued \| hidden` 로 통일 |
| 브랜드 스키마 | `Database` 인터페이스는 `name`만 정의, 실제는 `name_ko/name_en/logo_image_url/slug` 사용 | `Database` 타입을 실제 스키마와 100% 일치 |
| 태그 관계 | 아이템 리스트 API가 `tags: []` 하드코딩 반환 | 모든 리스트/상세 API가 실제 연결관계를 채워 반환 |
| 이미지 저장 | `items.image_url` + `item_images`, `projects.cover_image_url` + `project_images` + `photos/project_photos` 혼재(3중화) | 단일 이미지 자산 모델로 통일 |
| 인가 | 모든 API가 `supabaseAdmin` 으로 RLS 우회 | 서버측 역할 검증 + RLS 기반 접근 제어 |

- `src/lib/supabase.ts`의 `Database` 타입은 실제 DB 스키마와 동기화되어야 한다(가능하면 자동 생성).

---

## 4. 디자인시스템 요구사항 (Vapor UI + Tailwind v4)

- 글로벌 스타일은 Vapor UI 공식 Tailwind v4 연동 방식을 따른다.

```css
@layer tw-theme, vapor, tw-utilities;
@import '@vapor-ui/core/tailwind.css';
@import 'tailwindcss/theme.css' layer(tw-theme);
@import 'tailwindcss/utilities.css' layer(tw-utilities);
```

- 디자인 토큰 유틸은 `v-` 프리픽스 사용(`bg-v-primary`, `p-v-100`, `text-v-foreground` 등).
- 스타일 우선순위: `Tailwind 유틸 > Vapor 유틸 > Vapor 컴포넌트 기본 스타일`.
- Vapor의 자체 reset을 사용하며 Tailwind `preflight`는 기본 비활성(필요 시 공식 레이어 순서로만 추가).
- 레이아웃은 Vapor 테마 프로바이더 기반(라이트/다크 토큰 정의)으로 구성한다.
- 전 화면(프로젝트/사진/아이템/브랜드/태그/관리자/로그인/회원가입)과 공통 컴포넌트(`MainLayout`, `Sidebar` 등)의 antd 컴포넌트를 Vapor 컴포넌트로 교체한다.
- Vapor에 1:1 대응이 없는 컴포넌트(고급 테이블, 업로드 등)는 `@vapor-ui/hooks` + Tailwind 합성 또는 헤드리스 라이브러리로 대체한다.
- 인라인 `style={{...}}` 하드코딩은 Tailwind 유틸 + Vapor 토큰으로 치환한다.
- 접근성(키보드 내비게이션, 색 대비)을 만족한다.
- 컴포넌트 API의 단일 진실 소스는 `https://vapor-ui.goorm.io/docs`.

---

## 5. 데이터 모델 요구사항

### 5-1. 엔티티 관계

- `brands` (1) ──< `items` (N): 아이템은 정확히 1개 브랜드에 소속.
- `projects` (N) >──< `items` (N): `project_items` 조인.
- `projects` (N) >──< `photos` (N): `project_photos` 조인 (`is_main`, `order` 포함).
- `photos` (N) >──< `items` (N): `photo_items` 조인.
- `tags` (`type`: project/item/photo/brand) ──< 각 엔티티: `project_tags / item_tags / photo_tags / brand_tags`.
- 이미지는 단일 자산 모델로 통일한다(예: `photos`를 단일 이미지 자산 테이블로 삼고 프로젝트/아이템 이미지를 조인 테이블로 연결). 레거시 이미지 컬럼/테이블은 deprecate 대상.

### 5-2. 엔티티별 입력 항목

- **프로젝트**: 프로젝트명, 설명, 지역, 완공연도, 면적(m²), 연결 사진(대표이미지 지정), 프로젝트 태그(다중), 연결 아이템(검색 선택, 다중), 문의 URL, 발행상태(`draft/published/hidden`).
- **아이템**: 아이템명, 설명, 이미지(다중·대표 지정), 나라장터 URL, 브랜드(택1), 아이템 태그(다중), 상태(`available/discontinued/hidden`).
- **사진**: 이미지(1장), 제목(선택), 대체텍스트, 설명, 연결 아이템(다중), 사진 태그(다중).
- **브랜드**: 브랜드명(국문/영문), 설명, 로고(원형 크롭), 커버 이미지, 브랜드 URL, 상태(노출/숨김), 브랜드 태그(다중).
- **태그**: 태그명, 태그 타입(project/item/photo/brand).

### 5-3. 무결성 제약

- 조인 테이블은 `UNIQUE(a_id, b_id)` 와 관계 의미에 맞는 FK(`ON DELETE CASCADE` 또는 `RESTRICT`)를 가진다.
- 대표 이미지(`is_main`)는 부모당 최대 1개만 허용한다.
- slug는 엔티티별 유니크하며, 생성/충돌 처리 로직은 단일화한다.

---

## 6. 데이터 정책 & 동작 로직 요구사항

### 6-1. 권한 (RBAC)

- 역할: `master`(전체), `admin`(콘텐츠 전체 CRUD), `content_manager`(제한적 CRUD, 사용자 관리 불가).
- 서버측에서 호출자 세션의 역할을 검증해 작업을 허용/거부한다.
- 공개 읽기는 anon 키 + RLS로 처리하며, `supabaseAdmin`의 무분별한 사용을 제거한다.

### 6-2. 발행/노출 정책

- 공개 노출 대상: 프로젝트 `published`, 아이템 `available`, 브랜드 `노출` 만.
- RLS 정책은 상태값과 연동된다(익명 select는 공개 대상만, 인증자는 전체).

### 6-3. 삭제/연쇄 동작

- 브랜드 삭제 시 소속 아이템 처리 규칙, 사진 삭제 시 조인 정리 규칙, 아이템 삭제 시 프로젝트/사진 연결 정리 규칙이 정의·구현되어야 한다.

---

## 7. 검색 기능 요구사항

- **글로벌 통합 검색**: 단일 진입점에서 프로젝트/아이템/브랜드/사진/태그를 교차 검색하고 타입별 그룹 결과를 제공한다.
- **엔티티별 리스트 검색/필터**: 키워드 + 필터(상태, 브랜드, 태그, 연도/지역 등) + 정렬 + 페이지네이션을 제공한다.
- **검색 대상 필드**: 이름/설명/태그명/브랜드명 등. 한글 검색 품질을 확보한다(`tsvector`/`pg_trgm` 또는 인덱싱된 `ilike`).
- **UX**: 디바운스, 로딩/빈/에러 상태, 결과 하이라이트, 전체 결과 보기 이동, 권한 기반 결과 필터링.
- 검색 파라미터 규격은 전 엔티티 API에서 일관된다.

---

## 8. 관리자 사용자 관리 요구사항 (master 전용)

- **목록**: 이름/이메일/역할/승인상태/최근 로그인/가입일 표시. 검색 · 역할/상태 필터 · 정렬 · 페이지네이션.
- **승인 워크플로우**: `pending → approved/rejected`. 가입 시 "이메일 인증 후 관리자 승인 필요" 안내 유지.
- **역할 변경**: `master/admin/content_manager` 부여·회수. 본인 강등 및 마지막 `master` 제거 방지 가드.
- **계정 조치**: 비활성/삭제(연쇄 영향 정의), 이름 인라인 편집.
- **안전장치**: 권한 변경·승인·삭제 등 민감 작업은 서버측에서 재검증된다.
- 사용자 관리 라우트/API는 `master`만 접근 가능하다.

---

## 9. 마이그레이션 & 호환성 제약

### 9-1. 기존 데이터 무손실 보존 (필수)

- **기존 데이터는 단 한 건도 유실되지 않는다.** 프로젝트/아이템/브랜드/사진/태그/관리자(profiles)의 모든 레코드와 엔티티 간 연결관계(브랜드-아이템, 프로젝트-아이템, 프로젝트-사진, 사진-아이템, 각 태그 연결)가 보존된다.
- **이미지 이관**: 레거시 이미지(`items.image_url`, `item_images`, `projects.cover_image_url`, `project_images`)는 신규 단일 이미지 모델로 빠짐없이 이관하며, 대표 이미지 지정(`is_main`)과 표시 순서(`order`)를 보존한다.
- **enum/값 매핑 보존**: 권한·상태값 통일 시 기존 값은 정의된 매핑 규칙에 따라 무손실 변환된다(예: `profiles.role` `general` → `content_manager`, `items.status` `unavailable` → 정의된 대응값). 매핑 규칙은 마이그레이션에 명문화한다.
- **식별자 보존**: 기존 레코드의 `id`(UUID)와 `slug`는 변경하지 않는다(외부 참조/URL 안정성 유지).
- **검증 가능성**: 마이그레이션 전/후 레코드 수와 연결 수를 비교 검증할 수 있어야 한다(검증 쿼리 또는 스크립트 포함).
- **재실행 안전성**: 마이그레이션/백필은 멱등(idempotent)하여 중복 실행해도 데이터가 손상되지 않는다.

### 9-2. 마이그레이션 절차 제약

- 모든 스키마 변경은 `migrations/NNN_*.sql`(연속 번호)로 추가하며 롤백 전략과 데이터 백필을 포함한다.
- 파괴적 변경(컬럼/테이블 제거)은 "신규 구조 추가·백필 → 구버전 deprecate 후 제거"의 2단계로 분리 가능해야 한다. 1단계만 적용된 중간 상태에서도 앱이 정상 동작한다.
- enum 값 변경(role/status)은 안전한 변환 경로(`ALTER TYPE ... ADD VALUE` + 데이터 변환 + 구값 정리)를 따른다.

---

## 10. 비목표 (Out of Scope)

- 공개 프론트엔드(소비자 사이트) 신규 구축. (단, 공개 노출 정책/API 계약은 정의한다.)
- 실데이터 신규 작성. (단, 더미데이터/시드는 정합화하여 유지한다.)

---

## 11. 완료 기준 (Acceptance Criteria)

- [ ] `rg "from 'antd'"` 및 `@ant-design/icons` import 결과 0건.
- [ ] `npm run lint` 0 error.
- [ ] `npx tsc --noEmit` 0 error.
- [ ] `npm test` 통과.
- [ ] `npm run test:e2e` 핵심 플로우(인증/권한 → CRUD → 업로드 → 검색 → 사용자관리) 통과.
- [ ] `src/lib/supabase.ts`의 `Database` 타입이 실제 스키마와 일치.
- [ ] 모든 리스트/상세 API가 연결관계(태그/브랜드/연결아이템/사진)를 실제 값으로 반환.
- [ ] 권한 없는 호출이 서버측에서 거부됨.
- [ ] 3장 정합화 표의 모든 항목이 "요구 결과" 상태로 해소됨.
- [ ] 마이그레이션 전/후 모든 엔티티의 레코드 수가 일치(의도된 통합 제외)하고, 연결관계·이미지·대표이미지·순서가 보존됨.
- [ ] 기존 `id`/`slug`가 변경되지 않았고, 권한·상태값이 정의된 매핑대로 무손실 변환됨.
