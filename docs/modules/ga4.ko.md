# Google Analytics 4 모듈

> [English](./ga4.md) · [← 루트로](../README.ko.md)

`GA4_PROPERTY_ID` 환경변수 설정 시 활성화.

## 도구

**기본**
| 도구 | 설명 |
|---|---|
| `list_accounts` | GA4 계정 목록 조회 |
| `list_properties` | 계정 내 속성(Property) 목록 조회 |
| `run_report` | 원하는 메트릭/디멘션 조합으로 커스텀 리포트 실행. 디멘션 필터 지원 |

**페이지 & 트래픽**
| 도구 | 설명 |
|---|---|
| `get_top_pages` | 페이지뷰, 세션, 체류시간, 이탈률 기준 인기 페이지 조회 |
| `get_traffic_sources` | 소스/매체별 트래픽 분석 |
| `check_youtube_ga4_traffic` | YouTube/Shorts 관련 GA4 세션만 필터링 (`youtube`, `youtu.be`, `shorts` 를 소스/매체/캠페인/랜딩페이지에서 탐색) |

**사용자 분석**
| 도구 | 설명 |
|---|---|
| `get_user_overview` | 사용자 개요 (총 사용자, 신규, 세션, 페이지뷰 등) |
| `get_users_by_country` | 국가별 사용자 분석 |
| `get_users_by_device` | 기기별 사용자 분석 (desktop, mobile, tablet) |

**트렌드 & 실시간**
| 도구 | 설명 |
|---|---|
| `get_trend_by_date` | 일별 트렌드 (페이지뷰, 세션, 사용자 추이) |
| `get_realtime` | 실시간 활성 사용자 및 페이지뷰 조회 |
| `compare_periods` | 기간 대비 비교 (전주/전월/전년 동기) |

**캠페인 분석**
| 도구 | 설명 |
|---|---|
| `get_ga4_campaign_performance` | 캠페인 성과 (세션, 사용자, 전환, 이탈률). 캠페인명 필터 지원 |
| `get_utm_breakdown` | UTM 파라미터 전체 분석 (campaign, source, medium, content, keyword) |
| `compare_campaigns` | 여러 캠페인 성과 비교 |
| `get_landing_page_performance` | 랜딩페이지별 성과 (세션, 이탈률, 전환, 수익) |
| `get_conversions_by_event` | 이벤트별 전환수/전환값 (purchase, sign_up, lead 등) |
| `get_ecommerce_summary` | 이커머스 요약 (수익, 거래수, 평균 구매액, 전환율) |

**메타데이터**
| 도구 | 설명 |
|---|---|
| `get_metadata` | 사용 가능한 모든 메트릭/디멘션 목록 조회 |
| `search_metadata` | 메트릭/디멘션 키워드 검색 |
| `list_categories` | 메트릭/디멘션 카테고리 목록 조회 |

## 설정

### 1. Google Cloud Console API 활성화

- **Google Analytics Data API**
- **Google Analytics Admin API**

### 2. Property ID 확인

1. [Google Analytics](https://analytics.google.com) 접속
2. 좌측 하단 **관리(톱니바퀴)** → **속성 설정**
3. 상단에 표시된 숫자 ID가 Property ID (예: `417304962`)

### 3. 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `GA4_PROPERTY_ID` | ✅ | 기본 GA4 Property ID. 설정하면 모듈 활성화 |

## 사용 예시

- "지난 7일간 날짜별 세션 수와 신규 사용자 수 보여줘"
- "이번 달 트래픽 소스별 유입 분석해줘"
- "지난 7일간 유튜브 쇼츠 유입이 GA4에 잡히는지 확인해줘"
- "지금 실시간으로 접속 중인 사용자 알려줘"
- "지난 30일간 페이지뷰 기준 상위 10개 페이지 보여줘"
- "지난달 캠페인 A vs 캠페인 B 비교해줘"

## 자주 쓰는 측정기준 & 지표

**측정기준 (Dimensions)**

| 값 | 설명 |
|---|---|
| `date` | 날짜 |
| `city` / `country` | 도시 / 국가 |
| `deviceCategory` | 기기 유형 (desktop / mobile / tablet) |
| `sessionSource` / `sessionMedium` | 트래픽 소스 / 매체 |
| `sessionCampaignName` | 캠페인명 |
| `pagePath` / `pageTitle` | 페이지 경로 / 제목 |

**지표 (Metrics)**

| 값 | 설명 |
|---|---|
| `sessions` | 세션 수 |
| `activeUsers` | 활성 사용자 |
| `newUsers` | 신규 사용자 |
| `bounceRate` | 이탈률 |
| `averageSessionDuration` | 평균 세션 시간 (초) |
| `screenPageViews` | 페이지뷰 |
| `conversions` | 전환수 |
| `totalRevenue` | 총 수익 |
| `engagementRate` | 참여율 |
