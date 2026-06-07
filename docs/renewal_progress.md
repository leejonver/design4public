# D4P-CMS 리뉴얼 진행 상황

브랜치: `renewal/vapor-rbac`

## 확정된 결정
1. 이미지 모델: `photos` 단일 자산 + `project_photos`(is_main/order) + `photo_items`(is_main/order). 브랜드 로고/커버는 컬럼 유지.
2. 파괴적 변경: 2단계 분리. 019=추가+백필+검증(적용됨), 020=DROP(staged, 미적용).
3. 값 매핑: role `general`→`content_manager`, item status `unavailable`→`discontinued`. (라이브 변환행 0)

## 완료기준(11장) — 현재 상태
- [x] antd / `@ant-design/icons` import **0**
- [x] `npm run lint` **0 error** (`eslint .`)
- [x] `npx tsc --noEmit` **0 error**
- [x] `npm test` **8 suites / 61 tests 통과**
- [x] `npm run build` 성공 (21 페이지 + 16 API + 미들웨어)
- [~] `npm run test:e2e` — login 4/4 통과. navigation 8건은 master 계정 자격증명(E2E_MASTER_EMAIL/PASSWORD) 필요 → 미제공 시 skip.
- [x] `database.types.ts` == 실스키마
- [x] 모든 리스트/상세 API 관계 실제값 반환 (dto.ts)
- [x] 권한없는 호출 서버측 거부 (requireRole/requireUser + AuthError)
- [x] 3장 정합화 표 전부 해소
- [x] 마이그레이션 무손실 — **019 프로덕션 적용 + 검증 PASS** (project 83/83, item 22/22, items.image_url 15/15, 대표이미지 1→9 복구, 단일대표 불변)
- [x] id/slug 불변, 값매핑 무손실 (role general 0건, status unavailable 0건; 제약만 적용)

## 적용된 마이그레이션
- 019_unify_image_model_and_constraints.sql — **적용됨** (`node scripts/run-migration.mjs ...`)
- 020_drop_legacy_image_stores.sql — **staged, 미적용** (백업 후 적용 권장)
- 검증: `python3 scripts/verify_image_migration.py` → PASS

## 남은 일 (선택)
- 인증 e2e 전체 실행: `E2E_MASTER_EMAIL`/`E2E_MASTER_PASSWORD`(승인된 master 계정) 제공 → navigation/CRUD 플로우 실행
- 020 적용: DB 백업 후 `node scripts/run-migration.mjs migrations/020_drop_legacy_image_stores.sql` (앱은 020 전/후 모두 정상동작)
- 커밋/PR
