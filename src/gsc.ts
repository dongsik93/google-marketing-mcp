import { google, searchconsole_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Google Search Console (Webmasters) API 클라이언트.
 * Search Analytics 쿼리 + 사이트 목록 + 색인 상태를 다룬다.
 *
 * 인증 스코프: webmasters.readonly (auth.ts의 GSC_SCOPE).
 */
export class GSCClient {
  private webmasters: searchconsole_v1.Searchconsole;

  constructor(auth: OAuth2Client) {
    this.webmasters = google.searchconsole({ version: "v1", auth: auth as any });
  }

  /** 등록된 사이트 목록 */
  async listSites() {
    const res = await this.webmasters.sites.list();
    return (res.data.siteEntry || []).map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel,
    }));
  }

  /**
   * Search Analytics 쿼리 — GSC의 모든 검색 데이터 조회의 핵심.
   * dimensions로 query/page/country/device/searchAppearance 조합.
   */
  async queryAnalytics(params: {
    siteUrl: string;
    startDate: string;
    endDate: string;
    dimensions?: string[]; // query | page | country | device | searchAppearance | date
    filters?: Array<{
      dimension: string;
      operator?: "equals" | "notEquals" | "contains" | "notContains";
      expression: string;
    }>;
    type?: "web" | "image" | "video" | "news" | "discover" | "googleNews";
    rowLimit?: number;
    startRow?: number;
    aggregationType?: "auto" | "byPage" | "byProperty";
  }) {
    const requestBody: searchconsole_v1.Schema$SearchAnalyticsQueryRequest = {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions,
      type: params.type,
      rowLimit: params.rowLimit ?? 100,
      startRow: params.startRow ?? 0,
      aggregationType: params.aggregationType,
    };

    if (params.filters?.length) {
      requestBody.dimensionFilterGroups = [
        {
          groupType: "and",
          filters: params.filters.map((f) => ({
            dimension: f.dimension,
            operator: f.operator || "equals",
            expression: f.expression,
          })),
        },
      ];
    }

    const res = await this.webmasters.searchanalytics.query({
      siteUrl: params.siteUrl,
      requestBody,
    });

    const dims = params.dimensions || [];
    const rows = (res.data.rows || []).map((r) => {
      const row: Record<string, any> = {};
      dims.forEach((d, i) => {
        row[d] = r.keys?.[i];
      });
      row.clicks = r.clicks ?? 0;
      row.impressions = r.impressions ?? 0;
      row.ctr = r.ctr ?? 0;
      row.position = r.position ?? 0;
      return row;
    });

    return {
      headers: [...dims, "clicks", "impressions", "ctr", "position"],
      rows,
      rowCount: rows.length,
    };
  }

  /** 특정 URL의 색인 상태 */
  async inspectUrl(siteUrl: string, inspectedUrl: string, languageCode = "ko") {
    const res = await this.webmasters.urlInspection.index.inspect({
      requestBody: {
        siteUrl,
        inspectionUrl: inspectedUrl,
        languageCode,
      },
    });
    return res.data;
  }

  /** 사이트맵 목록 */
  async listSitemaps(siteUrl: string) {
    const res = await this.webmasters.sitemaps.list({ siteUrl });
    return (res.data.sitemap || []).map((s) => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted,
      lastDownloaded: s.lastDownloaded,
      isPending: s.isPending,
      isSitemapsIndex: s.isSitemapsIndex,
      type: s.type,
      contents: s.contents,
      errors: s.errors,
      warnings: s.warnings,
    }));
  }
}
