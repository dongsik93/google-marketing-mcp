# Google Search Console 모듈

> [English](./gsc.md) · [← 루트로](../README.ko.md)

`GSC_SITE_URL` 환경변수 설정 시 활성화.

## 도구

| 도구 | 설명 |
|---|---|
| `gsc_list_sites` | Search Console 등록된 사이트 목록 조회 |
| `gsc_query` | Search Analytics 쿼리 — query/page/country/device/searchAppearance/date 자유 조합 |
| `gsc_top_queries` | 노출수 기준 검색어 TOP — 어떤 검색어로 사이트가 노출되는지 |
| `gsc_top_pages` | 노출수 기준 페이지 TOP — 어떤 글이 검색에 가장 많이 노출되는지 |
| `gsc_queries_by_page` | 특정 페이지로 들어온 검색어 — 한 글의 키워드 분석 |
| `gsc_inspect_url` | URL 색인 상태 검사 — 색인 여부, 모바일 적합성, 마지막 크롤링 |
| `gsc_list_sitemaps` | 사이트맵 목록 — 제출 일자, 색인 상태, 오류·경고 |

## 설정

### 1. Google Cloud Console API 활성화

- **Search Console API**

### 2. Site URL 확인

- **URL prefix 속성**: `https://example.com/` (끝 슬래시 포함)
- **Domain 속성**: `sc-domain:example.com`

### 3. 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `GSC_SITE_URL` | ✅ | Search Console 사이트 URL. 설정하면 모듈 활성화 |

## 사용 예시

- "지난 28일간 노출수 기준 검색어 TOP 20"
- "검색에서 노출이 가장 많은 페이지는?"
- "/my-best-article/ 페이지로 들어온 검색어 알려줘"
- "https://example.com/recent-post/ 색인 상태 확인해줘"
- "제출한 사이트맵 목록과 상태 보여줘"

## 사용 가능한 측정기준

| 값 | 설명 |
|---|---|
| `query` | 검색어 |
| `page` | 랜딩 페이지 |
| `country` | 국가 |
| `device` | 기기 유형 (desktop / mobile / tablet) |
| `searchAppearance` | 검색 표시 형식 (AMP, FAQ, Video 등) |
| `date` | 날짜 |
