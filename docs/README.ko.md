# google-marketing-mcp

[![npm](https://img.shields.io/npm/v/@dongsik/google-marketing-mcp)](https://www.npmjs.com/package/@dongsik/google-marketing-mcp)

[English](../README.md)

Claude Desktop에서 Google Analytics 4와 Google Ads 데이터를 자연어로 조회할 수 있는 MCP 서버입니다.

```bash
npx -y @dongsik/google-marketing-mcp
```

## 기능

### Google Analytics 4

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

### Google Ads

**캠페인 & 광고 구조**
| 도구 | 설명 |
|---|---|
| `ads_list_campaigns` | 캠페인 목록 조회 (상태, 채널 유형, 일일 예산 포함) |
| `ads_get_campaign_performance` | 기간별 캠페인 성과 (노출수, 클릭수, 비용, CTR, CPC, 전환수) |
| `ads_get_ad_group_performance` | 광고그룹별 성과 조회 |
| `ads_get_ad_performance` | 개별 광고 소재 성과 — A/B 테스트 결과 확인 |
| `ads_get_keyword_performance` | 기간별 키워드 성과, 캠페인 필터 지원 |
| `ads_get_search_terms` | **검색어 리포트** — 실제 유저 검색어별 성과. 네거티브 키워드 발굴 필수 |
| `ads_get_account_summary` | 계정 전체 성과 요약 및 일별 내역 |

**최적화 & 경쟁 분석**
| 도구 | 설명 |
|---|---|
| `ads_get_performance_by_device` | 기기별 성과 (MOBILE / DESKTOP / TABLET) |
| `ads_get_performance_by_geo` | 지역별 성과 분석 |
| `ads_get_budget_status` | 오늘 캠페인별 예산 소진율 및 남은 예산 |
| `ads_get_impression_share` | 노출점유율 — 예산/순위 손실 비율 |
| `ads_get_quality_score` | 키워드 품질평가점수 — 광고 관련성, 랜딩페이지 경험, 예상 CTR |

### GA4 + Google Ads 통합

| 도구 | 설명 |
|---|---|
| `get_roas_by_campaign` | 캠페인별 ROAS — Ads 비용과 GA4 수익을 캠페인명 기준으로 조합 |
| `get_click_session_gap` | 클릭-세션 괴리 분석 — 봇트래픽/UTM 유실/랜딩 오류 탐지 |
| `get_new_vs_returning_by_campaign` | 캠페인별 신규 vs 재방문 비율 — 실제 신규고객 획득 효율 및 CAC 계산 |
| `get_hourly_traffic_vs_budget` | GA4 시간대별 트래픽 vs Ads 예산 소진 — 피크 시간대 예산 기회손실 파악 |
| `get_utm_integrity_check` | UTM 태깅 정합성 검증 — Ads 캠페인명과 GA4 utm_campaign 불일치 탐지 |
| `get_campaign_product_revenue` | 캠페인별 상품 카테고리 매출 — 어느 캠페인이 어떤 카테고리를 팔고 있는지 |
| `get_conversion_time_profile` | 요일/시간대별 전환율 프로파일 — Ad Schedule 입찰조정 근거 데이터 |

## 사전 준비

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 생성하거나 선택합니다
2. **API 및 서비스 → 라이브러리** → 다음 API를 활성화합니다:
   - **Google Analytics Data API**
   - **Google Analytics Admin API**
   - **Google Ads API**
3. **API 및 서비스 → OAuth 동의 화면**
   - 사용자 유형을 **외부(External)**로 설정
   - 테스트 사용자에 본인 Google 계정 추가
4. **API 및 서비스 → 사용자 인증 정보** → **OAuth 2.0 클라이언트 ID** 생성
   - 애플리케이션 유형: **데스크톱 앱** 선택
5. JSON 파일 다운로드 → `client_secret.json`으로 저장

### 2. Google Ads Developer Token 발급

1. [Google Ads](https://ads.google.com/)에 로그인합니다
2. 우측 상단 도구 아이콘 클릭 → **API 센터**
3. Developer Token 신청
   - 테스트 계정: 즉시 발급
   - 프로덕션 계정: Google 검토 후 승인 (수일 소요)
4. 발급된 토큰을 복사해 둡니다

### 3. 각종 ID 확인

**GA4 Property ID 확인**
1. [Google Analytics](https://analytics.google.com) 접속
2. 좌측 하단 **관리(톱니바퀴 아이콘)** → **속성 설정**
3. 상단에 표시된 숫자 ID가 Property ID입니다 (예: `417304962`)

**Google Ads Customer ID 확인**
1. [Google Ads](https://ads.google.com/) 접속
2. 우측 상단에 `xxx-xxx-xxxx` 형식으로 표시됩니다
3. 대시를 제외한 숫자만 사용합니다 (예: `1234567890`)

## 설치

### Claude Desktop 설정

`claude_desktop_config.json` 파일을 열어 아래 내용을 추가합니다:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-marketing-mcp": {
      "command": "npx",
      "args": ["--package=@dongsik/google-marketing-mcp", "google-marketing-mcp"],
      "env": {
        "GA_CLIENT_SECRET_PATH": "/path/to/client_secret.json",
        "GA4_PROPERTY_ID": "123456789",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890",
        "GOOGLE_ADS_LOGIN_CUSTOMER_ID": "9876543210",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "발급받은_토큰"
      }
    }
  }
}
```

> **Windows 경로 예시:** `"C:\\Users\\사용자이름\\client_secret.json"`

### 환경변수

| 변수 | 필수 여부 | 설명 |
|---|---|---|
| `GA_CLIENT_SECRET_PATH` | 필수 | `client_secret.json` 파일의 절대 경로 |
| `GA4_PROPERTY_ID` | 선택 | 기본 GA4 Property ID. 설정하면 매 요청마다 입력할 필요 없음 |
| `GOOGLE_ADS_CUSTOMER_ID` | 선택 | Google Ads 광고 계정 Customer ID (숫자만, 예: `4279865238`) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | 선택 | MCC(관리자 계정) Customer ID. MCC를 통해 하위 계정에 접근할 때 필요 |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | 필수 | Google Ads API Developer Token |

### 최초 실행 및 인증

처음 실행 시 브라우저가 자동으로 열리며 Google 계정 로그인을 요청합니다. 로그인 후 권한을 허용하면 토큰이 로컬에 저장되어 이후에는 자동으로 인증됩니다.

## 사용 예시

Claude Desktop에서 자연어로 질문하세요:

**GA4**
- "지난 7일간 날짜별 세션 수와 신규 사용자 수 보여줘"
- "이번 달 트래픽 소스별 유입 분석해줘"
- "지금 실시간으로 접속 중인 사용자 현황 알려줘"
- "접근 가능한 GA4 Property 목록 조회해줘"
- "지난 30일간 페이지뷰 기준 상위 10개 페이지 보여줘"

**Google Ads**
- "현재 활성화된 캠페인 목록 보여줘"
- "이번 달 캠페인별 성과 보여줘 (노출수, 클릭수, 비용, 전환수)"
- "지난 30일간 클릭 수 기준 상위 50개 키워드 보여줘"
- "1월 한 달간 계정 전체 성과 요약해줘"
- "지난주 특정 캠페인 비용이 얼마야?"

## GA4 측정기준 & 지표

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

## License

MIT
