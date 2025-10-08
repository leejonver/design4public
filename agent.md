# D4P-CMS 유지보수 에이전트 시스템 가이드 (v1.0)

본 문서는 D4P-CMS를 장기 유지보수하는 AI 에이전트를 위한 운영 가이드입니다. 운영 정책, 안전장치, 코드베이스 맥락, 변경 절차, 체크리스트를 포함합니다.

## 1) 운영 원칙
- 단일 진실 소스: 프로덕션은 Next.js(App Router) + Supabase입니다.
- 최소 권한: 클라이언트는 `NEXT_PUBLIC_*`, 서버 작업은 `SUPABASE_SERVICE_ROLE_KEY`만 필요할 때 사용.
- 가역성: 모든 변경은 PR 기반, 작은 단위로 롤백 가능하게.
- 가독성 우선: 타입 명시, 명확한 변수명, 불필요한 try/catch 금지.

## 2) 핵심 경로
- 앱 페이지: `src/app/**`
- API Routes: `src/app/api/**` (Next.js Route Handlers)
- 공통 컴포넌트: `src/components/**`
- 인증/컨텍스트: `src/contexts/AuthContext.tsx`
- 유틸/클라이언트: `src/lib/api.ts`, `src/lib/supabase.ts`
- 타입 정의: `src/types/index.ts`

## 3) 환경 변수 계약
- 필수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 서버 권한 필요 시: `SUPABASE_SERVICE_ROLE_KEY`
- 금지: 문서/코드에 실제 키 하드코딩 금지. .env*와 배포 플랫폼의 Env만 사용.

## 4) 데이터/권한 규칙
- `profiles.role`: `master | admin | general`
- `profiles.status`: `pending | approved | rejected`
- 관리자 기능(API) 수행 시 서버 측에서 `supabaseAdmin` 사용하여 RLS 우회 필요.
- 공개 조회는 익명 키로 가능한 RLS 정책을 유지.

## 5) 변경 절차 (표준 오퍼레이션)
1. 이슈 생성 → 목표/범위/위험/롤백 계획 명시
2. 브랜치 생성 → 작은 커밋 단위 유지
3. 타입/린트/테스트 통과 보장
4. PR 작성 → 체크리스트 포함(아래 7절)
5. 코드리뷰 → 승인 후 머지/배포

## 6) 테스트 정책
- 단위/통합: `npm test`
- E2E: `npm run test:e2e` (Playwright, `playwright.config.ts`가 dev 서버를 자동 실행)
- 실패 시 우선순위: 인증/권한 > CRUD > 업로드 > 나머지 UI

## 7) PR 체크리스트
- [ ] 타입 에러 0, 린트 에러 0
- [ ] 신규/수정 API에 권한/에러처리 반영
- [ ] UI 접근성 영향 검토(키보드, 대비)
- [ ] 성능 영향 검토(불필요 리렌더/대용량 리스트)
- [ ] 문서 업데이트(README/가이드 해당 시)
- [ ] 마이그레이션 포함 시 롤백 전략 명시

## 8) 릴리스 관리
- 버전: `package.json`의 `version`을 SemVer로 관리 (핵심 기능/스키마 변경 시 minor/major 증가)
- 태그: `vX.Y.Z`
- 체인지로그: PR 제목/본문으로 자동 생성 기반 운영 권장

## 9) 자주 수정하는 포인트와 유의사항
- API 유틸(`src/lib/api.ts`): 응답 제네릭 명시, 오류 메시지 일관화
- Supabase 클라이언트(`src/lib/supabase.ts`): 서버 권한 작업은 `supabaseAdmin` 사용, 클라이언트 키 노출 주의
- 태그 타입 분리 로직: `tags`에 `type` 컬럼 존재 전제. UI 필터와 API 쿼리 일치 유지
- 업로드: `/api/upload`와 Storage 버킷/정책 정합성 확인 후 배포

## 10) 보안/컴플라이언스
- 공개 저장소에서 API 키/민감 URL/이메일+패스워드 예시를 제거
- RLS 정책 점검: 공개 조회 범위 과다 노출 금지
- 에러 로그에 민감정보 포함 금지

## 11) 운영 시나리오 가이드
- 401/403 증가: 토큰 만료/권한 매핑 확인 → `profiles`의 `role/status` 확인 → RLS 정책 검토
- 이미지 표시 실패: Storage 버킷 공개 정책/도메인 화이트리스트(Next 이미지 설정) 점검
- 태그 필터 오작동: UI 탭의 type과 API 쿼리 파라미터 동기화 확인

## 12) 배포
- 권장: Vercel. 빌드 전 `npm run lint && npx tsc --noEmit && npm test`
- 환경 변수는 Vercel 프로젝트 Settings에서 Production/Preview 모두 설정

---
본 문서는 v1.0.0 기준입니다. 구조 변경 시 이 파일을 먼저 업데이트하세요.

