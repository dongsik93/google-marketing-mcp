# YouTube Module (Data API v3 + Analytics API v2)

> [한국어](./youtube.ko.md) · [← Back to root](../../README.md)

Activated by setting `YT_CHANNEL_ID`.

## Tools

**Channel & Video Catalog (Data API v3)**
| Tool | Description |
|---|---|
| `yt_list_my_channels` | List channels owned by the authenticated user (subscribers, total views, video count, uploads playlist ID) |
| `yt_list_videos` | Channel video list (latest N) — title, publishedAt, duration, views, likes, comments, privacy status |
| `yt_video_stats` | Detailed info for one or more videos (title, description, tags, duration, statistics, category) |
| `yt_search_videos` | Search videos within a channel by keyword |

**Performance & Audience (Analytics API v2)**
| Tool | Description |
|---|---|
| `yt_analytics_summary` | Core metrics summary — views, watch time, avg view duration, avg view %, subscribers, likes, comments, shares (channel or single video) |
| `yt_analytics_report` | Generic Analytics report — free combination of metrics/dimensions/filters. Reproduces any Studio chart |
| `yt_top_videos` | Top videos in a date range, sortable by views / watch time / avg duration / avg % / likes / subscribers gained |
| `yt_daily_trend` | Daily trend (views, watch time, avg duration, subscribers gained/lost, likes) |
| `yt_audience_retention` | Per-second retention curve (`audienceWatchRatio` + `relativeRetentionPerformance`) — quantify Hook/CTA drop-off |
| `yt_traffic_sources` | Traffic source breakdown (YT_SEARCH, SHORTS, SUGGESTED_VIDEO, BROWSE, EXTERNAL, etc.) |
| `yt_search_terms` | Search terms viewers used to find your videos (YouTube Search traffic only) |
| `yt_views_by_country` | Views, watch time, avg duration by country |
| `yt_views_by_device` | Views by device (DESKTOP / MOBILE / TABLET / TV / GAME_CONSOLE) |
| `yt_demographics` | Viewer demographics (age group × gender %) |
| `yt_sharing_services` | Shares broken down by service (Twitter, Reddit, Facebook, Copy URL…) |
| `yt_playlist_performance` | Playlist performance (views, avg time in playlist, playlist starts, views per start) |

## Setup

### 1. Enable APIs in Google Cloud Console

- **YouTube Data API v3**
- **YouTube Analytics API**

### 2. Find your Channel ID

- Go to [YouTube Studio](https://studio.youtube.com/) → Settings → Channel → Advanced settings → **Channel ID**
- Or open your channel page and check the URL: `youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx`
- Format: `UC` + 22 characters

### 3. Environment variables

| Variable | Required | Description |
|---|---|---|
| `YT_CHANNEL_ID` | ✅ | Default YouTube Channel ID. Setting this enables the module |

## Usage Examples

- "List my latest 20 videos with view counts"
- "Show audience retention for video XXXXXXX from last week"
- "What are the top 10 traffic sources for my Shorts?"
- "Give me daily views for the last 30 days"
- "Which countries are watching my channel?"
- "Compare retention curves between video A and video B"
- "What search terms brought viewers to video XXX?"

## Common Metrics & Dimensions

**Metrics**

| Value | Description |
|---|---|
| `views` | Views |
| `estimatedMinutesWatched` | Estimated watch time (minutes) |
| `averageViewDuration` | Average view duration (seconds) |
| `averageViewPercentage` | Avg view % of video length |
| `subscribersGained` / `subscribersLost` | Subscribers gained / lost |
| `likes` / `dislikes` / `comments` / `shares` | Engagement |
| `audienceWatchRatio` | Per-section retention ratio |
| `relativeRetentionPerformance` | Retention vs similar videos |

**Dimensions**

| Value | Description |
|---|---|
| `video` | Video ID |
| `day` / `month` | Time bucket |
| `country` | Country |
| `deviceType` | DESKTOP / MOBILE / TABLET / TV / GAME_CONSOLE |
| `insightTrafficSourceType` | YT_SEARCH / SHORTS / SUGGESTED_VIDEO / BROWSE / EXTERNAL etc. |
| `insightTrafficSourceDetail` | Specific source (e.g. search query, referrer URL) |
| `ageGroup` / `gender` | Demographics |
| `sharingService` | Twitter / Reddit / Facebook / Copy URL etc. |
| `elapsedVideoTimeRatio` | Video position 0.0–1.0 (for retention curve) |
| `playlist` | Playlist ID |
