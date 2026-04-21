import { google, analyticsdata_v1beta, analyticsadmin_v1beta } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface DimensionFilter {
  fieldName: string;
  matchType: "EXACT" | "BEGINS_WITH" | "ENDS_WITH" | "CONTAINS" | "REGEXP";
  value: string;
  caseSensitive?: boolean;
}

export class GA4Client {
  private analyticsData: analyticsdata_v1beta.Analyticsdata;
  private analyticsAdmin: analyticsadmin_v1beta.Analyticsadmin;

  constructor(auth: OAuth2Client) {
    this.analyticsData = google.analyticsdata({ version: "v1beta", auth: auth as any });
    this.analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth: auth as any });
  }

  async listAccounts() {
    const res = await this.analyticsAdmin.accounts.list();
    return (res.data.accounts || []).map((a) => ({
      id: a.name?.split("/").pop(),
      displayName: a.displayName,
      regionCode: a.regionCode,
    }));
  }

  async listProperties(accountId: string) {
    const res = await this.analyticsAdmin.properties.list({
      filter: `parent:accounts/${accountId}`,
    });
    return (res.data.properties || []).map((p) => ({
      id: p.name?.split("/").pop(),
      displayName: p.displayName,
      timeZone: p.timeZone,
      currencyCode: p.currencyCode,
    }));
  }

  async runReport(params: {
    propertyId: string;
    startDate: string;
    endDate: string;
    metrics: string[];
    dimensions?: string[];
    dimensionFilters?: DimensionFilter[];
    limit?: number;
    orderBy?: string;
    orderDesc?: boolean;
  }) {
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
      metrics: params.metrics.map((m) => ({ name: m })),
      limit: String(params.limit || 100),
    };

    if (params.dimensions?.length) {
      request.dimensions = params.dimensions.map((d) => ({ name: d }));
    }

    if (params.dimensionFilters?.length) {
      request.dimensionFilter = this.buildDimensionFilter(params.dimensionFilters);
    }

    if (params.orderBy) {
      const isMetric = params.metrics.includes(params.orderBy);
      request.orderBys = [
        {
          desc: params.orderDesc ?? true,
          ...(isMetric
            ? { metric: { metricName: params.orderBy } }
            : { dimension: { dimensionName: params.orderBy } }),
        },
      ];
    }

    const res = await this.analyticsData.properties.runReport({
      property: `properties/${params.propertyId}`,
      requestBody: request,
    });

    return this.formatReportResponse(res.data);
  }

  async getTopPages(propertyId: string, startDate: string, endDate: string, limit = 20) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: ["screenPageViews", "sessions", "averageSessionDuration", "bounceRate"],
      dimensions: ["pagePath", "pageTitle"],
      limit,
      orderBy: "screenPageViews",
    });
  }

  async getTrafficSources(propertyId: string, startDate: string, endDate: string, limit = 20) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: ["sessions", "totalUsers", "newUsers", "bounceRate"],
      dimensions: ["sessionSource", "sessionMedium"],
      limit,
      orderBy: "sessions",
    });
  }

  async getUserOverview(propertyId: string, startDate: string, endDate: string) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: [
        "totalUsers", "newUsers", "sessions", "screenPageViews",
        "averageSessionDuration", "bounceRate", "sessionsPerUser",
      ],
    });
  }

  async getUsersByCountry(propertyId: string, startDate: string, endDate: string, limit = 20) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: ["totalUsers", "sessions", "screenPageViews"],
      dimensions: ["country"],
      limit,
      orderBy: "totalUsers",
    });
  }

  async getUsersByDevice(propertyId: string, startDate: string, endDate: string) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: ["totalUsers", "sessions", "screenPageViews", "averageSessionDuration"],
      dimensions: ["deviceCategory"],
      orderBy: "totalUsers",
    });
  }

  async getPagesByDate(propertyId: string, startDate: string, endDate: string) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: ["screenPageViews", "sessions", "totalUsers"],
      dimensions: ["date"],
      orderBy: "date",
      orderDesc: false,
    });
  }

  async getRealtimeReport(propertyId: string) {
    const res = await this.analyticsData.properties.runRealtimeReport({
      property: `properties/${propertyId}`,
      requestBody: {
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        dimensions: [{ name: "city" }, { name: "deviceCategory" }],
        limit: "50",
      },
    });
    return this.formatReportResponse((res as any).data);
  }

  async getCampaignPerformance(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit = 20,
    campaignName?: string
  ) {
    const filters: DimensionFilter[] = [];
    if (campaignName) {
      filters.push({ fieldName: "sessionCampaignName", matchType: "CONTAINS", value: campaignName });
    }
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: ["sessions", "totalUsers", "newUsers", "screenPageViews", "averageSessionDuration", "bounceRate", "conversions"],
      dimensions: ["sessionCampaignName", "sessionSource", "sessionMedium"],
      dimensionFilters: filters.length ? filters : undefined,
      limit,
      orderBy: "sessions",
    });
  }

  async getUtmBreakdown(propertyId: string, startDate: string, endDate: string, limit = 30) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: ["sessions", "totalUsers", "newUsers", "bounceRate", "conversions"],
      dimensions: ["sessionCampaignName", "sessionSource", "sessionMedium", "sessionManualAdContent", "sessionGoogleAdsKeyword"],
      limit,
      orderBy: "sessions",
    });
  }

  async getCampaignComparison(
    propertyId: string,
    startDate: string,
    endDate: string,
    campaignNames: string[]
  ) {
    const results: Record<string, any> = {};
    for (const name of campaignNames) {
      results[name] = await this.runReport({
        propertyId, startDate, endDate,
        metrics: ["sessions", "totalUsers", "newUsers", "screenPageViews", "averageSessionDuration", "bounceRate", "conversions"],
        dimensions: ["sessionCampaignName"],
        dimensionFilters: [{ fieldName: "sessionCampaignName", matchType: "EXACT", value: name }],
      });
    }
    return results;
  }

  async getMetadata(propertyId: string) {
    const res = await this.analyticsData.properties.getMetadata({
      name: `properties/${propertyId}/metadata`,
    });
    return {
      dimensions: (res.data.dimensions || []).map((d) => ({
        apiName: d.apiName,
        uiName: d.uiName,
        category: d.category,
        description: d.description,
      })),
      metrics: (res.data.metrics || []).map((m) => ({
        apiName: m.apiName,
        uiName: m.uiName,
        category: m.category,
        description: m.description,
        type: m.type,
      })),
    };
  }

  async searchMetadata(propertyId: string, keyword: string, type?: "dimensions" | "metrics") {
    const metadata = await this.getMetadata(propertyId);
    const lower = keyword.toLowerCase();
    const match = (item: any) =>
      item.apiName?.toLowerCase().includes(lower) ||
      item.uiName?.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower) ||
      item.category?.toLowerCase().includes(lower);

    return {
      dimensions: !type || type === "dimensions" ? metadata.dimensions.filter(match) : [],
      metrics: !type || type === "metrics" ? metadata.metrics.filter(match) : [],
    };
  }

  async getLandingPagePerformance(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit = 30
  ) {
    return this.runReport({
      propertyId, startDate, endDate,
      dimensions: ["landingPage", "sessionSource", "sessionMedium", "sessionCampaignName"],
      metrics: ["sessions", "bounceRate", "conversions", "totalRevenue", "averageSessionDuration"],
      orderBy: "sessions",
      limit,
    });
  }

  async getConversionsByEvent(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit = 50
  ) {
    return this.runReport({
      propertyId, startDate, endDate,
      dimensions: ["eventName"],
      metrics: ["conversions", "totalRevenue"],
      orderBy: "conversions",
      limit,
    });
  }

  async getEcommerceSummary(propertyId: string, startDate: string, endDate: string) {
    return this.runReport({
      propertyId, startDate, endDate,
      metrics: [
        "totalRevenue",
        "transactions",
        "averagePurchaseRevenue",
        "ecommercePurchases",
        "purchaseToViewRate",
        "cartToViewRate",
      ],
    });
  }

  async comparePeriods(
    propertyId: string,
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string,
    metrics: string[],
    dimensions?: string[]
  ) {
    const [current, previous] = await Promise.all([
      this.runReport({ propertyId, startDate: currentStart, endDate: currentEnd, metrics, dimensions }),
      this.runReport({ propertyId, startDate: previousStart, endDate: previousEnd, metrics, dimensions }),
    ]);

    return {
      current: { dateRange: { start: currentStart, end: currentEnd }, ...current },
      previous: { dateRange: { start: previousStart, end: previousEnd }, ...previous },
    };
  }

  async listCategories(propertyId: string) {
    const metadata = await this.getMetadata(propertyId);
    return {
      dimensionCategories: [...new Set(metadata.dimensions.map((d) => d.category).filter(Boolean))],
      metricCategories: [...new Set(metadata.metrics.map((m) => m.category).filter(Boolean))],
    };
  }

  private buildDimensionFilter(filters: DimensionFilter[]): analyticsdata_v1beta.Schema$FilterExpression {
    if (filters.length === 1) {
      return {
        filter: {
          fieldName: filters[0].fieldName,
          stringFilter: { matchType: filters[0].matchType, value: filters[0].value, caseSensitive: filters[0].caseSensitive ?? false },
        },
      };
    }
    return {
      andGroup: {
        expressions: filters.map((f) => ({
          filter: {
            fieldName: f.fieldName,
            stringFilter: { matchType: f.matchType, value: f.value, caseSensitive: f.caseSensitive ?? false },
          },
        })),
      },
    };
  }

  private formatReportResponse(
    data: analyticsdata_v1beta.Schema$RunReportResponse | analyticsdata_v1beta.Schema$RunRealtimeReportResponse
  ) {
    const dimensionHeaders = (data.dimensionHeaders || []).map((h) => h.name || "unknown");
    const metricHeaders = (data.metricHeaders || []).map((h) => h.name || "unknown");

    const rows = (data.rows || []).map((row) => {
      const obj: Record<string, string> = {};
      (row.dimensionValues || []).forEach((v, i) => { obj[dimensionHeaders[i]] = v.value || ""; });
      (row.metricValues || []).forEach((v, i) => { obj[metricHeaders[i]] = v.value || ""; });
      return obj;
    });

    return {
      headers: [...dimensionHeaders, ...metricHeaders],
      rows,
      rowCount: data.rowCount || 0,
    };
  }
}
