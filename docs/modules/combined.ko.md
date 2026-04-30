# GA4 + Google Ads 통합 도구

> [English](./combined.md) · [← 루트로](../README.ko.md)

GA4와 Google Ads 데이터를 교차 참조하는 도구입니다. **`GA4_PROPERTY_ID`와 `GOOGLE_ADS_DEVELOPER_TOKEN`이 모두 설정**되면 자동 활성화됩니다.

## 도구

| 도구 | 설명 |
|---|---|
| `get_roas_by_campaign` | 캠페인별 ROAS — Ads 비용과 GA4 수익을 캠페인명 기준으로 조합 |
| `get_click_session_gap` | 클릭-세션 괴리 분석 — 봇트래픽/UTM 유실/랜딩 오류 탐지 |
| `get_new_vs_returning_by_campaign` | 캠페인별 신규 vs 재방문 비율 — 실제 신규고객 획득 효율 및 CAC 계산 |
| `get_hourly_traffic_vs_budget` | GA4 시간대별 트래픽 vs Ads 예산 소진 — 피크 시간대 예산 기회손실 파악 |
| `get_utm_integrity_check` | UTM 태깅 정합성 검증 — Ads 캠페인명과 GA4 utm_campaign 불일치 탐지 |
| `get_campaign_product_revenue` | 캠페인별 상품 카테고리 매출 — 어느 캠페인이 어떤 카테고리를 팔고 있는지 |
| `get_conversion_time_profile` | 요일/시간대별 전환율 프로파일 — Ad Schedule 입찰조정 근거 데이터 |

## 설정

두 모듈 모두 활성화 필요:

- [GA4 설정](./ga4.ko.md)
- [Google Ads 설정](./ads.ko.md)

두 환경변수가 모두 있으면 통합 도구가 자동 등록됩니다.

## 사용 예시

- "지난달 전체 캠페인 ROAS 계산해줘"
- "클릭 대비 세션이 비정상적으로 적은 캠페인 찾아줘"
- "캠페인별 신규고객 1명당 비용 알려줘"
- "예산 소진 후에도 트래픽 피크 시간대 있어?"
- "Ads와 GA4 UTM 태깅 정합성 체크해줘"
- "각 캠페인이 어떤 상품 카테고리를 팔고 있는지 분석"
- "요일/시간대별 전환율 프로파일 보여줘"
