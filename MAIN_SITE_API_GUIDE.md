# Design4Public 메인사이트 API 가이드

## 1. 개요

이 문서는 Design4Public의 메인 웹사이트 (`www.design4public.com`) 구축을 위해 필요한 API 사용 방법을 안내합니다. 메인 웹사이트는 CMS에 등록된 데이터를 조회하여 보여주는 역할만 수행하며, 별도의 회원가입이나 로그인 기능은 없습니다.

API는 Supabase에서 제공하는 RESTful API를 직접 사용하며, `anon` 키를 이용해 안전하게 데이터에 접근할 수 있습니다.

## 2. 인증 및 기본 정보

모든 API 요청에는 인증을 위한 API 키가 필요합니다. 또한, 모든 요청의 기본 URL은 다음과 같습니다.

- **Base URL**: `https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/`
- **API Key (`anon key`)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dXVkYnhoZmZuYnpqeGdxYWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjQ3MDAsImV4cCI6MjA3MjU0MDcwMH0.WVWlZ2-KZBu1fSHz9u8o7ymbMrLS4G2cglquzcFMZDs`

### 요청 헤더 설정

모든 요청의 헤더(Header)에 아래 두 값을 반드시 포함해야 합니다.

```
apikey: {API Key}
Authorization: Bearer {API Key}
```

**예시:**

```bash
curl -X GET \
  'https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/projects' \
  --header 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dXVkYnhoZmZuYnpqeGdxYWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjQ3MDAsImV4cCI6MjA3MjU0MDcwMH0.WVWlZ2-KZBu1fSHz9u8o7ymbMrLS4G2cglquzcFMZDs' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dXVkYnhoZmZuYnpqeGdxYWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjQ3MDAsImV4cCI6MjA3MjU0MDcwMH0.WVWlZ2-KZBu1fSHz9u8o7ymbMrLS4G2cglquzcFMZDs'
```

---

## 3. API Endpoints

주요 데이터(프로젝트, 브랜드, 아이템, 태그 등)를 조회할 수 있는 엔드포인트 정보입니다.

### 3.1. 프로젝트 (Projects)

프로젝트 정보는 `projects` 테이블에 저장되어 있습니다.

#### A. 모든 프로젝트 목록 조회

- **Method**: `GET`
- **URL**: `/projects`
- **설명**: `published` 상태인 모든 프로젝트 목록을 조회합니다.
- **쿼리 파라미터**:
    - `select`: 가져올 컬럼을 지정합니다. (예: `id,title,cover_image_url`)
    - `status`: 프로젝트 상태로 필터링합니다. (예: `eq.published`)
    - `order`: 정렬 순서를 지정합니다. (예: `year.desc`)

**예시: `published` 상태인 모든 프로젝트의 `id`, `title`, `cover_image_url`, `year`를 `year` 내림차순으로 조회**

```bash
curl -X GET \
  'https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/projects?select=id,title,cover_image_url,year&status=eq.published&order=year.desc' \
  --header 'apikey: {API_KEY}' \
  --header 'Authorization: Bearer {API_KEY}'
```

**응답 예시:**
```json
[
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "title": "공공디자인 개선 프로젝트",
        "cover_image_url": "https://example.com/cover.jpg",
        "year": 2023
    },
    {
        "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
        "title": "스마트 도시 디자인",
        "cover_image_url": "https://example.com/smart_city.jpg",
        "year": 2022
    }
]
```

#### B. 특정 프로젝트 상세 조회

- **Method**: `GET`
- **URL**: `/projects?id=eq.{project_id}`
- **설명**: 지정된 `id`를 가진 특정 프로젝트의 상세 정보를 조회합니다.

**예시: 특정 프로젝트의 모든 정보 조회**
```bash
curl -X GET \
  'https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/projects?id=eq.a1b2c3d4-e5f6-7890-1234-567890abcdef' \
  --header 'apikey: {API_KEY}' \
  --header 'Authorization: Bearer {API_KEY}'
```

**응답 예시:**
```json
[
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "title": "공공디자인 개선 프로젝트",
        "description": "이 프로젝트는 도시의 공공 공간을 개선하기 위한 것입니다...",
        "cover_image_url": "https://example.com/cover.jpg",
        "year": 2023,
        "area": 150.5,
        "status": "published",
        "created_at": "2023-10-27T10:00:00Z",
        "updated_at": "2023-10-28T12:00:00Z"
    }
]
```

#### C. 관련 데이터와 함께 프로젝트 조회 (매우 유용)

Supabase API의 `select` 파라미터를 사용하면, 한번의 요청으로 프로젝트와 관련된 다른 테이블의 데이터를 함께 가져올 수 있습니다. (SQL의 `JOIN`과 유사)

**예시: 프로젝트 정보와 함께 관련 태그(`tags`), 아이템(`items`), 브랜드(`brands`), 이미지(`project_images`) 정보 한번에 조회**

```bash
curl -X GET \
  'https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/projects?select=id,title,description,project_images(image_url,order),tags(id,name),project_items(items(id,name,brands(id,name))))&id=eq.{project_id}' \
  --header 'apikey: {API_KEY}' \
  --header 'Authorization: Bearer {API_KEY}'
```

**응답 예시:**
```json
[
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "title": "공공디자인 개선 프로젝트",
        "description": "이 프로젝트는 도시의 공공 공간을 개선하기 위한 것입니다...",
        "project_images": [
            {
                "image_url": "https://example.com/image1.jpg",
                "order": 1
            },
            {
                "image_url": "https://example.com/image2.jpg",
                "order": 2
            }
        ],
        "tags": [
            {
                "id": "tag-id-1",
                "name": "도시재생"
            },
            {
                "id": "tag-id-2",
                "name": "공원"
            }
        ],
        "project_items": [
            {
                "items": {
                    "id": "item-id-1",
                    "name": "스마트 벤치",
                    "brands": {
                        "id": "brand-id-1",
                        "name": "공공 가구 브랜드"
                    }
                }
            }
        ]
    }
]
```
---

### 3.2. 브랜드 (Brands)

- **테이블명**: `brands`
- **주요 컬럼**: `id`, `name`, `description`, `cover_image_url`, `website_url`

#### A. 모든 브랜드 목록 조회

- **Method**: `GET`
- **URL**: `/brands?select=*`

**예시:**
```bash
curl -X GET \
  'https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/brands?select=*' \
  --header 'apikey: {API_KEY}' \
  --header 'Authorization: Bearer {API_KEY}'
```
---

### 3.3. 아이템 (Items)

- **테이블명**: `items`
- **주요 컬럼**: `id`, `name`, `description`, `brand_id`, `nara_url`, `image_url`

#### A. 모든 아이템 목록 조회

- **Method**: `GET`
- **URL**: `/items?select=*,brands(id,name)`
- **설명**: 모든 아이템 목록을 관련 브랜드 정보와 함께 조회합니다.

**예시:**
```bash
curl -X GET \
  'https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/items?select=*,brands(id,name)' \
  --header 'apikey: {API_KEY}' \
  --header 'Authorization: Bearer {API_KEY}'
```
---

### 3.4. 태그 (Tags)

- **테이블명**: `tags`
- **주요 컬럼**: `id`, `name`

#### A. 모든 태그 목록 조회

- **Method**: `GET`
- **URL**: `/tags?select=*`

**예시:**
```bash
curl -X GET \
  'https://ftuudbxhffnbzjxgqagp.supabase.co/rest/v1/tags?select=*' \
  --header 'apikey: {API_KEY}' \
  --header 'Authorization: Bearer {API_KEY}'
```
---

## 4. 추가 정보

- **필터링, 정렬, 페이지네이션**: Supabase PostgREST API는 강력한 필터링, 정렬, 페이지네이션 기능을 제공합니다. 자세한 내용은 아래 공식 문서를 참고하세요.
  - [Supabase Docs: Filtering](https://supabase.com/docs/reference/javascript/filter)
  - [Supabase Docs: Select Query](https://supabase.com/docs/guides/api/rest/querying-with-select)

- **RLS (Row Level Security)**: 모든 테이블에는 행 수준 보안이 활성화되어 있어, `anon` 키로는 `published` 상태의 데이터 등 공개가 허용된 데이터만 조회할 수 있습니다. (보안 정책은 CMS에서 관리합니다.)

궁금한 점이 있다면 언제든지 문의해주세요.


