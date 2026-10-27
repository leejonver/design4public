# SEO 측정·개선 루프 — 2026-10-27

## 도구와 범위

사용자 지정 [AgriciDaniel/chatgpt-seo](https://github.com/AgriciDaniel/chatgpt-seo), SEO-pro 0.2.16, 커밋 `b9dd5c8fab722c7610184927a902ca689165d322`의 seo-audit, seo-page, seo-drift 워크플로를 적용했다. 플러그인 설치를 가정하지 않고 저장소를 임시 폴더에 받아 `analyze_html.py`, `validate_sitemap.py`, `compare_snapshots.py`를 직접 실행했다. 외부 유료 API 호출 없음.

국내 공공조달 가구 사례·제품 탐색 사이트라는 전제로 검토했다. 사이트맵에서 발견한 1,560개 URL 중 홈, 목록 4개, 법적 문서 2개, 프로젝트·아이템·브랜드·사진 상세 각 2개, 포토 페이지 2·3 등 총 17개를 표본으로 선정했다. 전체 URL의 상태·색인 여부를 검증한 결과가 아니다.

`before.json`은 운영 HTML에 대한 도구 결과 요약이다. 원본 수집은 3개 동시 요청으로 제한했다. ego lite에서 포토 페이지와 TOSS 프로젝트의 렌더링 및 모바일 페이지 이동을 별도로 확인했다.

## 근거 및 개선

| ID | 우선순위 | 관찰 / 근거 | 수정 / 성공 기준 |
| --- | --- | --- | --- |
| SEO-01 | 높음 | `/photos?page=2`, `?page=3`은 서로 다른 사진을 표시하지만 canonical이 `/photos`였다. source HTML + ego 렌더링, 확신 높음 | 페이지 번호별 canonical 및 OG URL, 제목을 생성. 2·3페이지가 각각 자기 URL을 가리키고 다음 페이지 이동 후에도 유지 |
| SEO-02 | 중간 | 홈 title에 design4public이 두 번 출력. `before.json` 첫 행, source HTML, 확신 높음 | 중첩 title template의 기본값 수정. 브랜드명 한 번만 출력 |
| SEO-03 | 중간 | 포토 목록 1·2·3페이지 각각 60개 이미지 alt가 비어 있음. 프로젝트 대표 슬라이드와 홈 대표 사진도 빈 alt. 의미 있는 사진이라는 수동 판단 포함 | 저장된 alt → 제목 → 실제 프로젝트명 순으로 대체 텍스트 제공. 목록·대표 사진의 빈 alt 해소. 버튼 내부 장식 썸네일의 빈 alt는 정상으로 유지 |
| SEO-04 | 중간 | 상세 페이지의 원본 사진 치수가 일괄 1200×630으로 선언됨. TOSS 브라우저 이미지 종횡비는 595:362로 선언 비율과 다름. 코드 `getSeoImages`가 고정 값을 생성함 | 실제 치수를 모르는 이미지에는 OG 너비·높이를 생략. 원본 URL은 유지. 실제로 1200×630으로 생성되는 공통 OG 이미지는 정상 치수를 유지 |
| SEO-05 | 낮음 | 사이트맵 홈·목록 5개 lastmod에 생성 시점이 사용됨. 소스 `sitemap.ts` | 실제 변경 날짜를 알 수 없는 경로는 lastmod 생략. 개별 콘텐츠의 DB 수정일과 법적 문서의 고정 날짜는 유지 |
| SEO-06 | 낮음 / 예방 | 빈 문자열 CMS 설명은 fallback을 우회할 수 있음. `compactText` 소스 재현 | 공백만 있는 설명에는 기존 사실 기반 fallback 사용. 단위 테스트로 검증 |

모든 조치의 담당은 개발이며, 외부 콘텐츠 작성·DB 변경에 의존하지 않는 작은 템플릿 수정이다. SEO-01을 우선 검증하고 나머지 항목을 같은 배포로 반영한다. 검색 순위 상승이나 색인 성공을 보장하는 조치로 해석하지 않는다.

## 정상 관찰 및 제한

- 기준 표본 17개 모두 HTTP 200, title/description/canonical 및 JSON-LD 존재. JSON-LD 파싱 오류 없음. 실제 검색 색인 여부나 리치 결과 적격성을 확인한 것은 아님.
- 사이트맵 1,560항목: 중복 URL·잘못된 날짜 문법·namespace 오류 없음. 목적지 전체 요청은 하지 않았다.
- robots.txt는 공개 경로 허용, API·관리자 경로 제한. 의도된 보호 설정은 유지했다.
- PageSpeed Insights 공개 API는 HTTP 429 / RESOURCE_EXHAUSTED로 실패. 실사용 CWV, Lighthouse 점수, GSC 클릭·노출·CTR·순위, 백링크, AI 인용 데이터는 미측정. 전체 SEO 점수를 산출하지 않았다.
- 로컬 DB는 운영과 달라 최신 제품·사진 표본 4개가 404였다. 초기 병렬 dev 컴파일 때 프로젝트 2개는 ContactModalProvider 오류가 발생했으나 TOSS 재조회는 정상. 이후 운영 데이터를 사용하는 배포본과 공개 운영 사이트에서 17개 모두 HTTP 200으로 재검증했다.

## 다음 루프 후보

1. 콘텐츠 담당: 동일 제목인 개별 사진과 짧은 프로젝트 설명에 실제 공간·납품 품목·해결 과제 정보를 보강. 임의 사실이나 키워드를 자동 생성하지 않는다.
2. 운영/마케팅 담당: Search Console의 동일 검색 유형·국가·기기 조건으로 배포 전후 각 28일 데이터를 비교. 재크롤링을 확인하고 계절성·다른 변경 영향을 함께 고려한다. 클릭 증가를 이번 코드만의 효과로 단정하지 않는다.
3. 개발 담당: PageSpeed/CrUX 접근이 가능해지면 모바일/데스크톱 LCP·INP·CLS와 실험실 진단을 별도 수집한다.
4. 제품 담당: 홈의 사이트 목적 설명과 기존 공통 OG 이미지 대신 대표 프로젝트 이미지를 쓸 필요가 있는지 검토한다. 현재 대표 프로젝트 중심 구성을 바꿀지는 실제 검색 유입·사용자 과제 근거로 결정한다.

## 검증 기준 출처

- [Google 페이지네이션](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading): 서로 다른 페이지는 고유 URL과 자기 canonical 유지.
- [Google 이미지 안내](https://developers.google.com/search/docs/appearance/google-images): 이미지와 주변 맥락에 맞는 대체 텍스트.
- [Google 사이트맵 안내](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): lastmod는 의미 있는 실제 변경을 반영.

코드 회귀 검증: 175개 기존·추가 단위 테스트 일괄 통과 후, 대체 텍스트 테스트 1개와 사이트맵 테스트 1개를 추가하여 해당 파일 재검증 통과(총 177개). TypeScript·ESLint 통과. 로컬 Next.js 빌드와 Vercel 운영 빌드도 통과했다.


## 운영 전후 결과

코드 커밋 `10abe01`을 푸시하고 운영 배포 `dpl_4ZjzxUFiFxS4ycwMqZREJvCBcQad`를 검증 후 승격했다. 운영 URL: https://www.design4public.com

`after.json`은 **동일 17개 운영 URL**의 재측정 요약, `changes.json`은 패키지 `compare_snapshots.py` 결과의 변경 필드 및 제어 변경 요약이다. 스크립트는 canonical 변경을 high_review로 표시했으며, 포토 페이지 2·3의 의도한 수정임을 확인했다. 그 외 robots/noindex 제어 변경은 없다. OG 이미지 선언은 분석기의 비교 필드에 없어서 별도의 HTML meta 추출 결과(`og_image_metadata`)로 비교했다.

| 직접 검증한 항목 | 이전 | 이후 |
| --- | ---: | ---: |
| 서로 다른 포토 페이지의 잘못된 canonical (2·3페이지 표본) | 2 | 0 |
| 홈 title 내 브랜드명 등장 횟수 | 2 | 1 |
| 포토 목록 1·2·3페이지의 빈 alt | 180 / 180 | 0 / 180 |
| 전체 17개 표본의 빈 alt | 210 | 17 |
| 홈·목록에 생성 시각으로 기록되는 sitemap lastmod | 5 | 0 |
| HTTP 200 표본 | 17 / 17 | 17 / 17 |
| JSON-LD 파싱 오류 | 0 | 0 |
| 사이트맵 URL 수 | 1,560 | 1,560 |

남은 빈 alt 17개는 프로젝트 갤러리 사진 12개와 제품 썸네일 5개다. 프로젝트 갤러리는 사진별 실제 설명을 보강할 다음 콘텐츠 작업으로 남겼으며, 제품 썸네일은 이름이 있는 버튼 안의 중복 이미지다. 단순히 모든 빈 alt를 오류로 합산하지 않는다. 이번 대체 문구는 기존 이름·제목만 사용한 기본 설명이며 개별 사진의 구체적 시각 설명을 대체하지 않는다.

운영 ego lite 모바일 390px에서 포토 2페이지 사진 60개, 빈 alt 0개, 자기 canonical, 가로 넘침 없음 확인. 로컬에서는 2→3페이지 클릭 후 title/canonical 갱신 및 TOSS 대표 사진 설명도 확인했다. 운영 배포의 최근 10분 error 로그 조회 결과 없음. 전체 관리자 CMS E2E나 GSC 실제 색인 검증은 수행하지 않았다.

### 동일 측정 재실행 방법

지정한 도구 커밋을 checkout한 후 선택 URL의 공개 HTML을 파일로 저장하고 다음 오프라인 명령을 실행한다. URL 목록은 `before.json`의 `pages[].url`이다. 요청일·도구 버전·HTTP 상태를 함께 남긴다.

```sh
python3 <plugin-root>/scripts/analyze_html.py <page.html> --url <원래-운영-URL>
python3 <plugin-root>/scripts/validate_sitemap.py <sitemap.xml>
python3 <plugin-root>/scripts/compare_snapshots.py <before-analyzer.json> <after-analyzer.json>
```

저장소의 before/after 파일은 읽기 쉬운 **요약 형식**이며 비교 스크립트의 직접 입력 형식은 아니다. 재실행 시 `analyze_html.py`의 원본 출력을 별도 파일에 저장하여 `compare_snapshots.py`에 전달한다. 모든 수치는 이 표본과 캡처 시점의 관찰값이다.
