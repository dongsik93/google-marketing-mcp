# Google Ads 모듈

> [English](./ads.md) · [← 루트로](../README.ko.md)

`GOOGLE_ADS_DEVELOPER_TOKEN` 환경변수 설정 시 활성화.

## 도구

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

## 설정

### 1. Google Cloud Console API 활성화

- **Google Ads API**

### 2. Developer Token 발급

1. [Google Ads](https://ads.google.com/) 로그인
2. 우측 상단 도구 아이콘 → **API 센터**
3. Developer Token 신청
   - 테스트 계정: 즉시 발급
   - 프로덕션 계정: Google 검토 후 승인 (수일 소요)

### 3. Customer ID 확인

1. [Google Ads](https://ads.google.com/) 접속
2. 우측 상단에 `xxx-xxx-xxxx` 형식으로 표시
3. 대시 제외한 숫자만 사용 (예: `1234567890`)

### 4. 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ✅ | Developer Token. 설정하면 모듈 활성화 |
| `GOOGLE_ADS_CUSTOMER_ID` | 선택 | 기본 Customer ID (숫자만) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | 선택 | MCC(관리자 계정) Customer ID. MCC를 통해 하위 계정 접근 시 필요 |

## 사용 예시

- "현재 활성화된 캠페인 목록 보여줘"
- "이번 달 캠페인별 성과 보여줘 (노출수, 클릭수, 비용, 전환수)"
- "지난 30일간 클릭 수 기준 상위 50개 키워드 보여줘"
- "1월 한 달간 계정 전체 성과 요약해줘"
- "품질점수 낮은 키워드 알려줘"
- "지난 7일 검색어 리포트 뽑아줘"
