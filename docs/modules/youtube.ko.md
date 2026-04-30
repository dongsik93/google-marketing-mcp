# YouTube 모듈 (Data API v3 + Analytics API v2)

> [English](./youtube.md) · [← 루트로](../README.ko.md)

`YT_CHANNEL_ID` 환경변수 설정 시 활성화.

## 도구

**채널 & 영상 카탈로그 (Data API v3)**
| 도구 | 설명 |
|---|---|
| `yt_list_my_channels` | 인증된 사용자가 소유한 채널 목록 (구독자, 총 조회수, 영상수, uploads 플레이리스트 ID) |
| `yt_list_videos` | 채널 영상 목록 (최신 N개) — 제목, 발행일, 길이, 조회수, 좋아요, 댓글, 공개 상태 |
| `yt_video_stats` | 1개 또는 다중 영상 상세 정보 (제목·설명·태그·길이·통계·카테고리) |
| `yt_search_videos` | 채널 내 영상 검색 (제목/설명 키워드) |

**성과 & 시청자 (Analytics API v2)**
| 도구 | 설명 |
|---|---|
| `yt_analytics_summary` | 핵심 지표 요약 — 조회수·시청시간·평균지속·평균조회율·구독·좋아요·댓글·공유 (채널 또는 영상 1개) |
| `yt_analytics_report` | 범용 Analytics 리포트 — metrics·dimensions·filters 자유 조합. Studio의 모든 차트 재현 |
| `yt_top_videos` | 기간 내 상위 영상 (조회수/시청시간/평균지속/평균%/좋아요/구독증가 정렬) |
| `yt_daily_trend` | 일별 추이 (조회수·시청시간·평균지속·구독 증감·좋아요) |
| `yt_audience_retention` | 초별 이탈 그래프 (`audienceWatchRatio` + `relativeRetentionPerformance`) — Hook/CTA 효과 정량 분석 |
| `yt_traffic_sources` | 트래픽 소스 분석 (YT_SEARCH·SHORTS·SUGGESTED_VIDEO·BROWSE·EXTERNAL 등) |
| `yt_search_terms` | 시청자가 영상 찾은 검색어 (YouTube 검색 트래픽 한정) |
| `yt_views_by_country` | 국가별 조회수·시청시간·평균지속 |
| `yt_views_by_device` | 기기별 조회수 (DESKTOP / MOBILE / TABLET / TV / GAME_CONSOLE) |
| `yt_demographics` | 시청자 인구통계 (연령 × 성별 비율) |
| `yt_sharing_services` | 공유 서비스별 공유 횟수 (Twitter, Reddit, Facebook, Copy URL 등) |
| `yt_playlist_performance` | 재생목록 성과 (조회수·평균 재생목록 시간·시작수·시작당 조회수) |

## 설정

### 1. Google Cloud Console API 활성화

- **YouTube Data API v3**
- **YouTube Analytics API**

### 2. Channel ID 확인

- [YouTube Studio](https://studio.youtube.com/) → 설정 → 채널 → 고급 설정 → **채널 ID**
- 또는 채널 페이지 URL 확인: `youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx`
- 형식: `UC` + 22자

### 3. 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `YT_CHANNEL_ID` | ✅ | 기본 YouTube Channel ID. 설정하면 모듈 활성화 |

### 4. 토큰 분리 (v0.4.0+)

YouTube는 GA4/GSC/Ads와 **별도 OAuth 토큰**을 사용합니다. YouTube 채널이 **Brand Account** 산하인 반면 GA/GSC는 개인 Google 계정인 흔한 케이스를 충돌 없이 처리하기 위함.

| 파일 | 모듈 |
|---|---|
| `~/.google-marketing-mcp/token.json` | GA4, GSC, Ads |
| `~/.google-marketing-mcp/token.youtube.json` | YouTube 전용 |

YouTube 첫 호출 시 브라우저가 `prompt=select_account` 로 열려 Brand Account를 직접 선택할 수 있습니다. 재인증은 `token.youtube.json` 삭제 후 호출.

### 5. Brand Account 주의사항

채널이 Google Brand Account 소유이고 OAuth 단계에서 **"이 서비스를 사용할 수 없습니다"** 가 뜨면:

- [Google Cloud Console → OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent) 접속
- **테스트(Testing)** 상태면 **테스트 사용자**에 Brand Account 이메일 추가
- 또는 **In production** 으로 게시 (sensitive scope 사용 시 Google 검증 필요)

## 사용 예시

- "최근 20개 영상 조회수랑 같이 보여줘"
- "영상 XXXXXXX 지난주 시청 유지율 그래프 보여줘"
- "내 숏츠 트래픽 소스 TOP 10"
- "지난 30일 일별 조회수 추이"
- "어느 나라에서 내 채널을 보고 있어?"
- "영상 A vs 영상 B 유지율 곡선 비교해줘"
- "영상 XXX 로 들어온 검색어 알려줘"

## 자주 쓰는 지표 & 측정기준

**지표 (Metrics)**

| 값 | 설명 |
|---|---|
| `views` | 조회수 |
| `estimatedMinutesWatched` | 추정 시청 시간 (분) |
| `averageViewDuration` | 평균 시청 지속 시간 (초) |
| `averageViewPercentage` | 영상 길이 대비 평균 시청률 |
| `subscribersGained` / `subscribersLost` | 구독 증가 / 감소 |
| `likes` / `dislikes` / `comments` / `shares` | 참여 지표 |
| `audienceWatchRatio` | 구간별 유지율 |
| `relativeRetentionPerformance` | 유사 영상 대비 유지율 |

**측정기준 (Dimensions)**

| 값 | 설명 |
|---|---|
| `video` | 영상 ID |
| `day` / `month` | 시간 버킷 |
| `country` | 국가 |
| `deviceType` | DESKTOP / MOBILE / TABLET / TV / GAME_CONSOLE |
| `insightTrafficSourceType` | YT_SEARCH / SHORTS / SUGGESTED_VIDEO / BROWSE / EXTERNAL 등 |
| `insightTrafficSourceDetail` | 구체 소스 (검색어, referrer URL 등) |
| `ageGroup` / `gender` | 인구통계 |
| `sharingService` | Twitter / Reddit / Facebook / Copy URL 등 |
| `elapsedVideoTimeRatio` | 영상 위치 0.0–1.0 (유지율 곡선용) |
| `playlist` | 플레이리스트 ID |
