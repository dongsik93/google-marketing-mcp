import { google, youtube_v3, youtubeAnalytics_v2 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface YouTubeAnalyticsParams {
  channelId: string;
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
  filters?: string;
  sort?: string;
  maxResults?: number;
}

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private analytics: youtubeAnalytics_v2.Youtubeanalytics;

  constructor(auth: OAuth2Client) {
    this.youtube = google.youtube({ version: "v3", auth: auth as any });
    this.analytics = google.youtubeAnalytics({ version: "v2", auth: auth as any });
  }

  // ── Data API v3 ──────────────────────────────────────────────────────────

  /** 인증된 사용자가 소유한 채널 목록 (mine=true) */
  async listMyChannels() {
    const res = await this.youtube.channels.list({
      part: ["snippet", "contentDetails", "statistics"],
      mine: true,
    });
    return (res.data.items || []).map((c) => ({
      id: c.id,
      title: c.snippet?.title,
      customUrl: c.snippet?.customUrl,
      uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads,
      subscriberCount: c.statistics?.subscriberCount,
      viewCount: c.statistics?.viewCount,
      videoCount: c.statistics?.videoCount,
    }));
  }

  /** 채널 uploads 플레이리스트 → 영상 목록 (최신순) */
  async listChannelVideos(channelId: string, maxResults = 50) {
    // 먼저 uploads 플레이리스트 ID 조회
    const channelRes = await this.youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    });
    const uploadsPlaylistId =
      channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      throw new Error(`uploads 플레이리스트를 찾을 수 없습니다 (channelId=${channelId})`);
    }

    // 플레이리스트 아이템 페이지네이션
    const items: youtube_v3.Schema$PlaylistItem[] = [];
    let pageToken: string | undefined;
    while (items.length < maxResults) {
      const res = await this.youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: uploadsPlaylistId,
        maxResults: Math.min(50, maxResults - items.length),
        pageToken,
      });
      items.push(...(res.data.items || []));
      pageToken = res.data.nextPageToken || undefined;
      if (!pageToken) break;
    }

    const videoIds = items
      .map((it) => it.contentDetails?.videoId)
      .filter((v): v is string => !!v);

    if (videoIds.length === 0) return [];

    // videos.list 로 통계·길이 일괄 조회 (50개씩)
    const stats: Record<string, youtube_v3.Schema$Video> = {};
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const vRes = await this.youtube.videos.list({
        part: ["snippet", "statistics", "contentDetails", "status"],
        id: chunk,
      });
      for (const v of vRes.data.items || []) {
        if (v.id) stats[v.id] = v;
      }
    }

    return videoIds.map((id) => {
      const v = stats[id];
      return {
        id,
        title: v?.snippet?.title,
        publishedAt: v?.snippet?.publishedAt,
        duration: v?.contentDetails?.duration,
        privacyStatus: v?.status?.privacyStatus,
        viewCount: v?.statistics?.viewCount,
        likeCount: v?.statistics?.likeCount,
        commentCount: v?.statistics?.commentCount,
        favoriteCount: v?.statistics?.favoriteCount,
      };
    });
  }

  /** 단일 영상 (또는 다중) 통계 조회 */
  async getVideoStats(videoIds: string[]) {
    if (videoIds.length === 0) return [];
    const result: any[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const res = await this.youtube.videos.list({
        part: ["snippet", "statistics", "contentDetails", "status", "topicDetails"],
        id: chunk,
      });
      for (const v of res.data.items || []) {
        result.push({
          id: v.id,
          title: v.snippet?.title,
          description: v.snippet?.description,
          channelId: v.snippet?.channelId,
          channelTitle: v.snippet?.channelTitle,
          publishedAt: v.snippet?.publishedAt,
          tags: v.snippet?.tags,
          categoryId: v.snippet?.categoryId,
          duration: v.contentDetails?.duration,
          definition: v.contentDetails?.definition,
          privacyStatus: v.status?.privacyStatus,
          viewCount: v.statistics?.viewCount,
          likeCount: v.statistics?.likeCount,
          commentCount: v.statistics?.commentCount,
          favoriteCount: v.statistics?.favoriteCount,
          topicCategories: v.topicDetails?.topicCategories,
        });
      }
    }
    return result;
  }

  /** 영상 검색 (채널 한정) */
  async searchVideos(channelId: string, query: string, maxResults = 25) {
    const res = await this.youtube.search.list({
      part: ["snippet"],
      channelId,
      q: query,
      type: ["video"],
      order: "date",
      maxResults,
    });
    return (res.data.items || []).map((it) => ({
      id: it.id?.videoId,
      title: it.snippet?.title,
      publishedAt: it.snippet?.publishedAt,
      description: it.snippet?.description,
    }));
  }

  /** @handle / channel URL / UC... 값을 실제 채널 ID로 해석 */
  async resolveChannel(identifier: string) {
    const normalized = identifier.trim();
    const ucMatch = normalized.match(/UC[a-zA-Z0-9_-]{20,}/);
    if (ucMatch) {
      const res = await this.youtube.channels.list({
        part: ["snippet", "statistics"],
        id: [ucMatch[0]],
      });
      return (res.data.items || []).map((c) => ({
        id: c.id,
        title: c.snippet?.title,
        customUrl: c.snippet?.customUrl,
        subscriberCount: c.statistics?.subscriberCount,
        viewCount: c.statistics?.viewCount,
        videoCount: c.statistics?.videoCount,
        matchType: "channelId",
      }));
    }

    const handleMatch =
      normalized.match(/youtube\.com\/@([a-zA-Z0-9._-]+)/) ||
      normalized.match(/^@([a-zA-Z0-9._-]+)$/);

    if (handleMatch) {
      const handle = handleMatch[1];
      const res = await this.youtube.channels.list({
        part: ["snippet", "statistics"],
        ...( { forHandle: handle } as any ),
      } as any);
      if (res.data.items?.length) {
        return res.data.items.map((c) => ({
          id: c.id,
          title: c.snippet?.title,
          customUrl: c.snippet?.customUrl,
          subscriberCount: c.statistics?.subscriberCount,
          viewCount: c.statistics?.viewCount,
          videoCount: c.statistics?.videoCount,
          matchType: "handle",
        }));
      }
    }

    const query = normalized
      .replace(/^https?:\/\/(www\.)?youtube\.com\//, "")
      .replace(/^@/, "");
    const res = await this.youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["channel"],
      maxResults: 5,
    });
    const channelIds = (res.data.items || [])
      .map((it) => it.snippet?.channelId)
      .filter((id): id is string => !!id);
    if (channelIds.length === 0) return [];

    const channelRes = await this.youtube.channels.list({
      part: ["snippet", "statistics"],
      id: channelIds,
    });
    return (channelRes.data.items || []).map((c) => ({
      id: c.id,
      title: c.snippet?.title,
      customUrl: c.snippet?.customUrl,
      subscriberCount: c.statistics?.subscriberCount,
      viewCount: c.statistics?.viewCount,
      videoCount: c.statistics?.videoCount,
      matchType: "search",
    }));
  }

  // ── Analytics API v2 ─────────────────────────────────────────────────────

  /** 범용 Analytics 리포트 — Studio 데이터 정확히 재현 */
  async runAnalyticsReport(params: YouTubeAnalyticsParams) {
    const res = await this.analytics.reports.query({
      ids: `channel==${params.channelId}`,
      startDate: params.startDate,
      endDate: params.endDate,
      metrics: params.metrics.join(","),
      dimensions: params.dimensions?.join(","),
      filters: params.filters,
      sort: params.sort,
      maxResults: params.maxResults || 100,
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 채널/영상 핵심 지표 요약 */
  async getReportSummary(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string
  ) {
    const metrics = [
      "views",
      "estimatedMinutesWatched",
      "averageViewDuration",
      "averageViewPercentage",
      "subscribersGained",
      "subscribersLost",
      "likes",
      "dislikes",
      "comments",
      "shares",
    ];
    const filters = videoId ? `video==${videoId}` : undefined;
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: metrics.join(","),
      filters,
    });
    const headers = (res.data.columnHeaders || []).map((h) => h.name || "");
    const row = res.data.rows?.[0] || [];
    const summary: Record<string, any> = {};
    headers.forEach((h, i) => {
      summary[h] = row[i];
    });
    return summary;
  }

  /** 트래픽 소스별 조회수 (검색·피드·관련·채널·외부 등) */
  async getTrafficSources(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string,
    maxResults = 25
  ) {
    const filters = videoId ? `video==${videoId}` : undefined;
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration",
      dimensions: "insightTrafficSourceType",
      filters,
      sort: "-views",
      maxResults,
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 시청자 유지율 (audienceWatchRatio · relativeRetentionPerformance) */
  async getAudienceRetention(
    channelId: string,
    videoId: string,
    startDate: string,
    endDate: string
  ) {
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "audienceWatchRatio,relativeRetentionPerformance",
      dimensions: "elapsedVideoTimeRatio",
      filters: `video==${videoId}`,
      sort: "elapsedVideoTimeRatio",
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 인구통계 (연령·성별) */
  async getDemographics(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string
  ) {
    const filters = videoId ? `video==${videoId}` : undefined;
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "viewerPercentage",
      dimensions: "ageGroup,gender",
      filters,
      sort: "gender,ageGroup",
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 국가별 조회수 */
  async getViewsByCountry(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string,
    maxResults = 25
  ) {
    const filters = videoId ? `video==${videoId}` : undefined;
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration",
      dimensions: "country",
      filters,
      sort: "-views",
      maxResults,
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 기기별 (DESKTOP / MOBILE / TABLET / TV / GAME_CONSOLE) */
  async getViewsByDevice(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string
  ) {
    const filters = videoId ? `video==${videoId}` : undefined;
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration",
      dimensions: "deviceType",
      filters,
      sort: "-views",
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 일별 추이 */
  async getDailyTrend(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string
  ) {
    const filters = videoId ? `video==${videoId}` : undefined;
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes",
      dimensions: "day",
      filters,
      sort: "day",
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 기간 내 상위 영상 */
  async getTopVideos(
    channelId: string,
    startDate: string,
    endDate: string,
    maxResults = 25,
    sortMetric: string = "views"
  ) {
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,subscribersGained",
      dimensions: "video",
      sort: `-${sortMetric}`,
      maxResults,
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 검색어 (시청자가 영상 찾은 검색어) — Shorts 검색 트래픽 분석 */
  async getSearchTerms(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string,
    maxResults = 50
  ) {
    const filters = [
      "insightTrafficSourceType==YT_SEARCH",
      videoId ? `video==${videoId}` : null,
    ]
      .filter(Boolean)
      .join(";");

    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "insightTrafficSourceDetail",
      filters,
      sort: "-views",
      maxResults,
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 공유 서비스별 (Twitter, Reddit, Facebook 등) */
  async getSharingServices(
    channelId: string,
    startDate: string,
    endDate: string,
    videoId?: string,
    maxResults = 25
  ) {
    const filters = videoId ? `video==${videoId}` : undefined;
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "shares",
      dimensions: "sharingService",
      filters,
      sort: "-shares",
      maxResults,
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }

  /** 재생목록 성과 */
  async getPlaylistPerformance(
    channelId: string,
    startDate: string,
    endDate: string,
    maxResults = 25
  ) {
    const res = await this.analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,playlistStarts,viewsPerPlaylistStart,averageTimeInPlaylist",
      dimensions: "playlist",
      filters: "isCurated==1",
      sort: "-views",
      maxResults,
    });
    return {
      columnHeaders: res.data.columnHeaders,
      rows: res.data.rows,
    };
  }
}
