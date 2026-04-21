#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAuthenticatedClient, getRefreshToken } from "./auth.js";
import { GA4Client } from "./ga4.js";
import { GoogleAdsClient } from "./gads.js";

const CLIENT_SECRET_PATH =
  process.env.GA_CLIENT_SECRET_PATH ||
  new URL("../client_secret.json", import.meta.url).pathname;

const DEFAULT_GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "";
const DEFAULT_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || "";
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";

let ga4: GA4Client | null = null;
let gads: GoogleAdsClient | null = null;

async function getGA4(): Promise<GA4Client> {
  if (!ga4) {
    const auth = await getAuthenticatedClient(CLIENT_SECRET_PATH);
    ga4 = new GA4Client(auth);
  }
  return ga4;
}

async function getGAds(): Promise<GoogleAdsClient> {
  if (!gads) {
    if (!DEVELOPER_TOKEN) {
      throw new Error(
        "GOOGLE_ADS_DEVELOPER_TOKEN 환경변수가 설정되지 않았습니다."
      );
    }
    const auth = await getAuthenticatedClient(CLIENT_SECRET_PATH);
    const refreshToken = getRefreshToken();
    gads = new GoogleAdsClient(
      auth,
      CLIENT_SECRET_PATH,
      DEVELOPER_TOKEN,
      DEFAULT_ADS_CUSTOMER_ID,
      refreshToken
    );
  }
  return gads;
}

function resolvePropertyId(propertyId?: string): string {
  const id = propertyId || DEFAULT_GA4_PROPERTY_ID;
  if (!id) {
    throw new Error(
      "propertyId가 필요합니다. 파라미터로 전달하거나 GA4_PROPERTY_ID 환경변수를 설정하세요."
    );
  }
  return id;
}

const instructions = [
  DEFAULT_GA4_PROPERTY_ID
    ? `GA4_PROPERTY_ID=${DEFAULT_GA4_PROPERTY_ID} 환경변수가 설정되어 있습니다. 사용자가 "연결 확인", "잘 되냐", "테스트" 등 단순 확인을 요청하더라도 list_accounts나 list_properties를 호출하지 마세요. 환경변수에 이미 기본 Property가 지정되어 있으므로 바로 데이터 조회 tool을 사용하세요.`
    : null,
  DEFAULT_ADS_CUSTOMER_ID
    ? `GOOGLE_ADS_CUSTOMER_ID=${DEFAULT_ADS_CUSTOMER_ID} 환경변수가 설정되어 있습니다. 사용자가 명시적으로 계정 목록을 요청하지 않는 한 ads_list_campaigns 등 데이터 tool을 바로 호출하세요.`
    : null,
]
  .filter(Boolean)
  .join("\n");

const server = new McpServer({
  name: "google-marketing-mcp",
  version: "0.1.3",
  ...(instructions ? { instructions } : {}),
});

const propertyIdSchema = DEFAULT_GA4_PROPERTY_ID
  ? z.string().optional().describe("GA4 Property ID (미입력 시 환경변수 GA4_PROPERTY_ID 사용)")
  : z.string().describe("GA4 Property ID (숫자)");

const customerIdSchema = DEFAULT_ADS_CUSTOMER_ID
  ? z.string().optional().describe("Google Ads Customer ID (미입력 시 환경변수 사용)")
  : z.string().describe("Google Ads Customer ID (숫자만, 예: 1234567890)");

const dimensionFilterSchema = z
  .array(
    z.object({
      fieldName: z.string().describe("필터 대상 디멘션 (예: pagePath, sessionCampaignName)"),
      matchType: z
        .enum(["EXACT", "BEGINS_WITH", "ENDS_WITH", "CONTAINS", "REGEXP"])
        .describe("매칭 방식"),
      value: z.string().describe("필터 값"),
      caseSensitive: z.boolean().optional().describe("대소문자 구분 (기본 false)"),
    })
  )
  .optional()
  .describe("디멘션 필터 목록");

// ── GA4 Tools ──────────────────────────────────────────────────────────────

server.tool(
  "list_accounts",
  DEFAULT_GA4_PROPERTY_ID
    ? "GA4 계정 목록 조회. 주의: GA4_PROPERTY_ID 환경변수가 이미 설정되어 있으므로 사용자가 명시적으로 계정 목록을 요청하지 않는 한 이 tool을 호출하지 말 것."
    : "GA4 계정 목록 조회",
  {},
  async () => {
    const client = await getGA4();
    const result = await client.listAccounts();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "list_properties",
  DEFAULT_GA4_PROPERTY_ID
    ? "GA4 속성(Property) 목록 조회. 주의: GA4_PROPERTY_ID 환경변수가 이미 설정되어 있으므로 사용자가 명시적으로 property 목록을 요청하지 않는 한 이 tool을 호출하지 말 것."
    : "GA4 속성(Property) 목록 조회",
  { accountId: z.string().describe("GA4 계정 ID (숫자)") },
  async ({ accountId }) => {
    const client = await getGA4();
    const result = await client.listProperties(accountId);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "run_report",
  "GA4 커스텀 리포트 실행. 원하는 메트릭과 디멘션을 자유롭게 조합 가능. 디멘션 필터로 특정 조건 필터링 가능",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일 (YYYY-MM-DD 또는 7daysAgo, 30daysAgo 등)"),
    endDate: z.string().describe("종료일 (YYYY-MM-DD 또는 today, yesterday 등)"),
    metrics: z.array(z.string()).describe(
      "메트릭 목록 (예: totalUsers, sessions, screenPageViews, bounceRate, averageSessionDuration, conversions)"
    ),
    dimensions: z.array(z.string()).optional().describe(
      "디멘션 목록 (예: pagePath, pageTitle, sessionSource, sessionMedium, sessionCampaignName, country, city, date, deviceCategory)"
    ),
    dimensionFilters: dimensionFilterSchema,
    limit: z.number().optional().describe("최대 행 수 (기본 100)"),
    orderBy: z.string().optional().describe("정렬 기준 필드명"),
    orderDesc: z.boolean().optional().describe("내림차순 여부 (기본 true)"),
  },
  async (params) => {
    const client = await getGA4();
    const result = await client.runReport({
      ...params,
      propertyId: resolvePropertyId(params.propertyId),
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_top_pages",
  "인기 페이지 조회 (페이지뷰, 세션, 체류시간, 이탈률)",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    limit: z.number().optional().describe("최대 행 수 (기본 20)"),
  },
  async ({ propertyId, startDate, endDate, limit }) => {
    const client = await getGA4();
    const result = await client.getTopPages(resolvePropertyId(propertyId), startDate, endDate, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_traffic_sources",
  "트래픽 소스 분석 (소스/매체별 세션, 사용자, 이탈률)",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    limit: z.number().optional().describe("최대 행 수 (기본 20)"),
  },
  async ({ propertyId, startDate, endDate, limit }) => {
    const client = await getGA4();
    const result = await client.getTrafficSources(resolvePropertyId(propertyId), startDate, endDate, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_user_overview",
  "사용자 개요 (총 사용자, 신규, 세션, 페이지뷰, 체류시간, 이탈률 등)",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
  },
  async ({ propertyId, startDate, endDate }) => {
    const client = await getGA4();
    const result = await client.getUserOverview(resolvePropertyId(propertyId), startDate, endDate);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_users_by_country",
  "국가별 사용자 분석",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    limit: z.number().optional().describe("최대 행 수 (기본 20)"),
  },
  async ({ propertyId, startDate, endDate, limit }) => {
    const client = await getGA4();
    const result = await client.getUsersByCountry(resolvePropertyId(propertyId), startDate, endDate, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_users_by_device",
  "기기별 사용자 분석 (desktop, mobile, tablet)",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
  },
  async ({ propertyId, startDate, endDate }) => {
    const client = await getGA4();
    const result = await client.getUsersByDevice(resolvePropertyId(propertyId), startDate, endDate);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_trend_by_date",
  "일별 트렌드 분석 (페이지뷰, 세션, 사용자 추이)",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
  },
  async ({ propertyId, startDate, endDate }) => {
    const client = await getGA4();
    const result = await client.getPagesByDate(resolvePropertyId(propertyId), startDate, endDate);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_realtime",
  "실시간 활성 사용자 및 페이지뷰 조회",
  { propertyId: propertyIdSchema },
  async ({ propertyId }) => {
    const client = await getGA4();
    const result = await client.getRealtimeReport(resolvePropertyId(propertyId));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_ga4_campaign_performance",
  DEVELOPER_TOKEN
    ? "GA4 기준 캠페인 성과 분석 — 웹사이트 유입/행동 지표 (세션, 사용자, 전환, 이탈률). '캠페인 성과'가 애매할 때는 GA4인지 Google Ads인지 사용자에게 먼저 확인할 것."
    : "캠페인 성과 분석 — 세션, 사용자, 전환, 이탈률 조회.",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    campaignName: z.string().optional().describe("특정 캠페인명으로 필터 (부분 일치)"),
    limit: z.number().optional().describe("최대 행 수 (기본 20)"),
  },
  async ({ propertyId, startDate, endDate, campaignName, limit }) => {
    const client = await getGA4();
    const result = await client.getCampaignPerformance(
      resolvePropertyId(propertyId),
      startDate,
      endDate,
      limit,
      campaignName
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_utm_breakdown",
  "UTM 파라미터 전체 분석 (campaign, source, medium, content, keyword)",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    limit: z.number().optional().describe("최대 행 수 (기본 30)"),
  },
  async ({ propertyId, startDate, endDate, limit }) => {
    const client = await getGA4();
    const result = await client.getUtmBreakdown(resolvePropertyId(propertyId), startDate, endDate, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "compare_campaigns",
  "여러 GA4 캠페인 성과 비교. 캠페인명을 배열로 전달하면 각각의 성과를 비교",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    campaignNames: z.array(z.string()).describe("비교할 캠페인명 목록 (정확히 일치)"),
  },
  async ({ propertyId, startDate, endDate, campaignNames }) => {
    const client = await getGA4();
    const result = await client.getCampaignComparison(
      resolvePropertyId(propertyId),
      startDate,
      endDate,
      campaignNames
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_landing_page_performance",
  "광고/캠페인 유입 랜딩페이지별 성과 조회 — 세션, 이탈률, 전환, 수익, 체류시간. 광고 최적화 핵심 지표.",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    limit: z.number().optional().describe("최대 행 수 (기본 30)"),
  },
  async ({ propertyId, startDate, endDate, limit }) => {
    const client = await getGA4();
    const result = await client.getLandingPagePerformance(resolvePropertyId(propertyId), startDate, endDate, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_conversions_by_event",
  "GA4 이벤트별 전환수/전환값 조회. purchase, sign_up, lead 등 전환 이벤트별 성과 확인.",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
    limit: z.number().optional().describe("최대 행 수 (기본 50)"),
  },
  async ({ propertyId, startDate, endDate, limit }) => {
    const client = await getGA4();
    const result = await client.getConversionsByEvent(resolvePropertyId(propertyId), startDate, endDate, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_ecommerce_summary",
  "이커머스 요약 — 총 수익, 거래수, 평균 구매액, 구매전환율, 장바구니 전환율. 이커머스 사이트 필수.",
  {
    propertyId: propertyIdSchema,
    startDate: z.string().describe("시작일"),
    endDate: z.string().describe("종료일"),
  },
  async ({ propertyId, startDate, endDate }) => {
    const client = await getGA4();
    const result = await client.getEcommerceSummary(resolvePropertyId(propertyId), startDate, endDate);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "compare_periods",
  "기간 대비 비교 (전주 대비, 전월 대비, 전년 동기 대비 등). 원하는 메트릭을 두 기간으로 나란히 비교.",
  {
    propertyId: propertyIdSchema,
    currentStart: z.string().describe("현재 기간 시작일 (YYYY-MM-DD)"),
    currentEnd: z.string().describe("현재 기간 종료일 (YYYY-MM-DD)"),
    previousStart: z.string().describe("비교 기간 시작일 (YYYY-MM-DD)"),
    previousEnd: z.string().describe("비교 기간 종료일 (YYYY-MM-DD)"),
    metrics: z.array(z.string()).describe("비교할 메트릭 목록 (예: ['sessions', 'conversions', 'totalRevenue'])"),
    dimensions: z.array(z.string()).optional().describe("디멘션 목록 (예: ['sessionCampaignName'])"),
  },
  async ({ propertyId, currentStart, currentEnd, previousStart, previousEnd, metrics, dimensions }) => {
    const client = await getGA4();
    const result = await client.comparePeriods(
      resolvePropertyId(propertyId),
      currentStart, currentEnd,
      previousStart, previousEnd,
      metrics, dimensions
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_metadata",
  "사용 가능한 모든 메트릭/디멘션 목록 조회. 어떤 데이터를 조회할 수 있는지 확인할 때 사용",
  {
    propertyId: propertyIdSchema,
    type: z.enum(["dimensions", "metrics", "both"]).optional().describe("조회 유형 (기본 both)"),
  },
  async ({ propertyId, type }) => {
    const client = await getGA4();
    const metadata = await client.getMetadata(resolvePropertyId(propertyId));
    const result =
      type === "dimensions"
        ? { dimensions: metadata.dimensions }
        : type === "metrics"
        ? { metrics: metadata.metrics }
        : metadata;
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "search_metadata",
  "메트릭/디멘션 키워드 검색. 예: 'campaign', 'user', 'page' 등으로 관련 필드 찾기",
  {
    propertyId: propertyIdSchema,
    keyword: z.string().describe("검색 키워드"),
    type: z.enum(["dimensions", "metrics"]).optional().describe("검색 대상 유형 (미지정 시 전체)"),
  },
  async ({ propertyId, keyword, type }) => {
    const client = await getGA4();
    const result = await client.searchMetadata(resolvePropertyId(propertyId), keyword, type);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "list_categories",
  "메트릭/디멘션 카테고리 목록 조회",
  { propertyId: propertyIdSchema },
  async ({ propertyId }) => {
    const client = await getGA4();
    const result = await client.listCategories(resolvePropertyId(propertyId));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── Google Ads Tools (GOOGLE_ADS_DEVELOPER_TOKEN 있을 때만 등록) ────────────

if (DEVELOPER_TOKEN) {
  server.tool(
    "ads_list_campaigns",
    "Google Ads 캠페인 목록 조회 (상태, 채널 유형, 일일 예산 포함)",
    {
      customerId: customerIdSchema,
      includePaused: z.boolean().optional().describe("일시중지 캠페인 포함 여부 (기본 true)"),
    },
    async ({ customerId, includePaused }) => {
      const client = await getGAds();
      const result = await client.listCampaigns(customerId, includePaused ?? true);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_campaign_performance",
    "Google Ads 기준 캠페인 성과 조회 — 광고 집행 지표 (노출수, 클릭수, 비용, CTR, CPC, 전환수). '캠페인 성과'가 애매할 때는 GA4인지 Google Ads인지 사용자에게 먼저 확인할 것.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링 (미입력 시 전체)"),
    },
    async ({ startDate, endDate, customerId, campaignId }) => {
      const client = await getGAds();
      const result = await client.getCampaignPerformance(startDate, endDate, customerId, campaignId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_search_terms",
    "Google Ads 검색어 리포트 — 실제 유저가 입력한 검색어별 성과. 네거티브 키워드 발굴, 광고비 낭비 차단용. 키워드와 다름.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링"),
      limit: z.number().optional().describe("최대 결과 수 (기본 100)"),
    },
    async ({ startDate, endDate, customerId, campaignId, limit }) => {
      const client = await getGAds();
      const result = await client.getSearchTerms(startDate, endDate, customerId, campaignId, limit);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_ad_group_performance",
    "Google Ads 광고그룹별 성과 조회 — 캠페인 하위 광고그룹 단위 (노출, 클릭, 비용, 전환). 캠페인 필터 지원.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링"),
    },
    async ({ startDate, endDate, customerId, campaignId }) => {
      const client = await getGAds();
      const result = await client.getAdGroupPerformance(startDate, endDate, customerId, campaignId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_ad_performance",
    "Google Ads 개별 광고 소재 성과 조회 — 광고별 노출, 클릭, 비용, 전환. A/B 테스트 결과 확인용.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링"),
      limit: z.number().optional().describe("최대 결과 수 (기본 100)"),
    },
    async ({ startDate, endDate, customerId, campaignId, limit }) => {
      const client = await getGAds();
      const result = await client.getAdPerformance(startDate, endDate, customerId, campaignId, limit);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_performance_by_device",
    "Google Ads 기기별(MOBILE/DESKTOP/TABLET) 성과 분석 — 기기별 광고비 효율 비교.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링"),
    },
    async ({ startDate, endDate, customerId, campaignId }) => {
      const client = await getGAds();
      const result = await client.getPerformanceByDevice(startDate, endDate, customerId, campaignId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_performance_by_geo",
    "Google Ads 지역별 성과 분석 — 국가/지역별 노출, 클릭, 비용, 전환.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링"),
      limit: z.number().optional().describe("최대 결과 수 (기본 50)"),
    },
    async ({ startDate, endDate, customerId, campaignId, limit }) => {
      const client = await getGAds();
      const result = await client.getPerformanceByGeo(startDate, endDate, customerId, campaignId, limit);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_budget_status",
    "오늘 기준 캠페인별 예산 소진율 및 남은 예산 확인. 예산 초과/미달 캠페인 빠르게 파악.",
    {
      customerId: customerIdSchema,
    },
    async ({ customerId }) => {
      const client = await getGAds();
      const result = await client.getBudgetStatus(customerId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_impression_share",
    "검색 캠페인 노출점유율(Impression Share) 조회 — 예산/순위 손실 비율로 광고 경쟁력 파악.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, customerId }) => {
      const client = await getGAds();
      const result = await client.getImpressionShare(startDate, endDate, customerId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_quality_score",
    "키워드별 품질평가점수(Quality Score) 조회 — 광고 관련성, 랜딩페이지 경험, 예상 CTR 포함. 낮은 점수 키워드 개선용.",
    {
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링"),
    },
    async ({ customerId, campaignId }) => {
      const client = await getGAds();
      const result = await client.getQualityScore(customerId, campaignId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_keyword_performance",
    "기간별 Google Ads 키워드 성과 조회 (노출수, 클릭수, 비용, CTR, CPC, 전환수). 캠페인 필터 지원",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
      campaignId: z.string().optional().describe("특정 캠페인 ID로 필터링"),
      limit: z.number().optional().describe("최대 결과 수 (기본 100)"),
    },
    async ({ startDate, endDate, customerId, campaignId, limit }) => {
      const client = await getGAds();
      const result = await client.getKeywordPerformance(startDate, endDate, customerId, campaignId, limit);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "ads_get_account_summary",
    "Google Ads 계정 전체 성과 요약 및 일별 내역 조회",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, customerId }) => {
      const client = await getGAds();
      const result = await client.getAccountSummary(startDate, endDate, customerId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_roas_by_campaign",
    "캠페인별 ROAS 계산 — Google Ads 비용과 GA4 수익을 캠페인명 기준으로 조합. 광고비 대비 매출 효율 파악.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      propertyId: propertyIdSchema,
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, propertyId, customerId }) => {
      const [ga4Client, adsClient] = await Promise.all([getGA4(), getGAds()]);

      const [ga4Data, adsData] = await Promise.all([
        ga4Client.getCampaignPerformance(resolvePropertyId(propertyId), startDate, endDate),
        adsClient.getCampaignPerformance(startDate, endDate, customerId),
      ]);

      // GA4 캠페인명 → 수익 맵
      const revenueMap: Record<string, { revenue: number; conversions: number }> = {};
      for (const row of ga4Data.rows as any[]) {
        const name = row["sessionCampaignName"] || "";
        if (!revenueMap[name]) revenueMap[name] = { revenue: 0, conversions: 0 };
        revenueMap[name].revenue += parseFloat(row["totalRevenue"] || "0");
        revenueMap[name].conversions += parseFloat(row["conversions"] || "0");
      }

      const combined = adsData.campaigns.map((c: any) => {
        const ga4 = revenueMap[c.campaignName] ?? { revenue: 0, conversions: 0 };
        const roas = c.cost > 0 ? Math.round((ga4.revenue / c.cost) * 100) / 100 : null;
        return {
          campaignName: c.campaignName,
          adsCost: c.cost,
          adsClicks: c.clicks,
          adsConversions: c.conversions,
          ga4Revenue: Math.round(ga4.revenue * 100) / 100,
          ga4Conversions: Math.round(ga4.conversions * 100) / 100,
          roas,
        };
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ dateRange: { start: startDate, end: endDate }, campaigns: combined }, null, 2),
        }],
      };
    }
  );
  // #2 클릭-세션 괴리 (봇/무효클릭 탐지)
  server.tool(
    "get_click_session_gap",
    "Google Ads 클릭수 vs GA4 세션수 괴리 분석 — 캠페인별 클릭 대비 세션 유입률이 낮으면 봇트래픽, 랜딩 오류, UTM 유실 의심. 광고비 낭비 탐지용.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      propertyId: propertyIdSchema,
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, propertyId, customerId }) => {
      const [ga4Client, adsClient] = await Promise.all([getGA4(), getGAds()]);

      const [ga4Data, adsData] = await Promise.all([
        ga4Client.runReport({
          propertyId: resolvePropertyId(propertyId),
          startDate, endDate,
          dimensions: ["sessionCampaignName"],
          metrics: ["sessions"],
          dimensionFilters: [{ fieldName: "sessionMedium", matchType: "EXACT", value: "cpc" }],
          limit: 200,
        }),
        adsClient.getCampaignPerformance(startDate, endDate, customerId),
      ]);

      const sessionMap: Record<string, number> = {};
      for (const row of ga4Data.rows as any[]) {
        sessionMap[row["sessionCampaignName"] || ""] = parseInt(row["sessions"] || "0", 10);
      }

      const result = adsData.campaigns.map((c: any) => {
        const ga4Sessions = sessionMap[c.campaignName] ?? 0;
        const ratio = c.clicks > 0 ? Math.round((ga4Sessions / c.clicks) * 10000) / 100 : null;
        return {
          campaignName: c.campaignName,
          adsClicks: c.clicks,
          ga4Sessions,
          sessionClickRatioPercent: ratio,
          status: ratio === null ? "no_clicks" : ratio < 70 ? "⚠️ 이상 (70% 미만)" : ratio < 85 ? "주의 (85% 미만)" : "정상",
        };
      });

      result.sort((a, b) => (a.sessionClickRatioPercent ?? 100) - (b.sessionClickRatioPercent ?? 100));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ dateRange: { start: startDate, end: endDate }, note: "정상범위: 85~100%. 70% 미만 캠페인은 랜딩 오류/UTM 유실/봇 의심.", campaigns: result }, null, 2),
        }],
      };
    }
  );

  // #8 신규 vs 재방문 광고비 배분
  server.tool(
    "get_new_vs_returning_by_campaign",
    "캠페인별 신규 vs 재방문 사용자 비율 분석 — 광고비가 신규 고객 획득에 쓰이는지, 재방문자만 잡고 있는지 파악. CAC 계산 기반.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      propertyId: propertyIdSchema,
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, propertyId, customerId }) => {
      const [ga4Client, adsClient] = await Promise.all([getGA4(), getGAds()]);

      const [newUsersData, returningData, adsData] = await Promise.all([
        ga4Client.runReport({
          propertyId: resolvePropertyId(propertyId),
          startDate, endDate,
          dimensions: ["sessionCampaignName", "newVsReturning"],
          metrics: ["sessions", "conversions"],
          dimensionFilters: [{ fieldName: "sessionMedium", matchType: "EXACT", value: "cpc" }],
          limit: 500,
        }),
        ga4Client.runReport({
          propertyId: resolvePropertyId(propertyId),
          startDate, endDate,
          dimensions: ["sessionCampaignName"],
          metrics: ["newUsers", "totalUsers"],
          dimensionFilters: [{ fieldName: "sessionMedium", matchType: "EXACT", value: "cpc" }],
          limit: 200,
        }),
        adsClient.getCampaignPerformance(startDate, endDate, customerId),
      ]);

      const userMap: Record<string, { newUsers: number; totalUsers: number }> = {};
      for (const row of returningData.rows as any[]) {
        userMap[row["sessionCampaignName"] || ""] = {
          newUsers: parseInt(row["newUsers"] || "0", 10),
          totalUsers: parseInt(row["totalUsers"] || "0", 10),
        };
      }

      const result = adsData.campaigns.map((c: any) => {
        const u = userMap[c.campaignName] ?? { newUsers: 0, totalUsers: 0 };
        const newRatio = u.totalUsers > 0 ? Math.round((u.newUsers / u.totalUsers) * 10000) / 100 : null;
        const costPerNewUser = u.newUsers > 0 ? Math.round((c.cost / u.newUsers) * 100) / 100 : null;
        return {
          campaignName: c.campaignName,
          adsCost: c.cost,
          totalUsers: u.totalUsers,
          newUsers: u.newUsers,
          returningUsers: u.totalUsers - u.newUsers,
          newUserRatioPercent: newRatio,
          costPerNewUser,
        };
      });

      result.sort((a, b) => (b.adsCost) - (a.adsCost));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ dateRange: { start: startDate, end: endDate }, campaigns: result }, null, 2),
        }],
      };
    }
  );

  // #10 예산 소진 vs 트래픽 피크 시간대
  server.tool(
    "get_hourly_traffic_vs_budget",
    "GA4 시간대별 트래픽 vs Google Ads 예산 소진 현황 비교 — 예산 소진 시점 이후에도 트래픽 피크가 있으면 예산 증액 또는 시간대 입찰 조정 필요.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      propertyId: propertyIdSchema,
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, propertyId, customerId }) => {
      const [ga4Client, adsClient] = await Promise.all([getGA4(), getGAds()]);

      const [hourlyData, budgetData] = await Promise.all([
        ga4Client.runReport({
          propertyId: resolvePropertyId(propertyId),
          startDate, endDate,
          dimensions: ["hour"],
          metrics: ["sessions", "conversions", "totalRevenue"],
          orderBy: "hour",
          orderDesc: false,
          limit: 24,
        }),
        adsClient.getBudgetStatus(customerId),
      ]);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            dateRange: { start: startDate, end: endDate },
            note: "시간대별 GA4 트래픽과 현재 예산 소진 현황을 비교하세요. 트래픽 피크 시간대에 예산이 소진되면 기회 손실.",
            hourlyTraffic: hourlyData.rows,
            currentBudgetStatus: budgetData.campaigns,
          }, null, 2),
        }],
      };
    }
  );

  // #13 UTM 태깅 정합성 검증
  server.tool(
    "get_utm_integrity_check",
    "Google Ads 캠페인명과 GA4 utm_campaign 매칭 검증 — 이름이 다르거나 GA4에서 (not set)으로 잡히는 캠페인 탐지. auto-tagging 오류, 수동 UTM 오타 발견용.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      propertyId: propertyIdSchema,
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, propertyId, customerId }) => {
      const [ga4Client, adsClient] = await Promise.all([getGA4(), getGAds()]);

      const [ga4Campaigns, adsCampaigns] = await Promise.all([
        ga4Client.runReport({
          propertyId: resolvePropertyId(propertyId),
          startDate, endDate,
          dimensions: ["sessionCampaignName"],
          metrics: ["sessions"],
          dimensionFilters: [{ fieldName: "sessionMedium", matchType: "EXACT", value: "cpc" }],
          limit: 200,
        }),
        adsClient.listCampaigns(customerId),
      ]);

      const ga4Names = new Set((ga4Campaigns.rows as any[]).map((r) => r["sessionCampaignName"] || ""));
      const adsNames = new Set(adsCampaigns.campaigns.map((c: any) => c.name));

      const onlyInAds = [...adsNames].filter((n) => !ga4Names.has(n));
      const onlyInGA4 = [...ga4Names].filter((n) => !adsNames.has(n) && n !== "(not set)" && n !== "");
      const notSet = (ga4Campaigns.rows as any[]).find((r) => r["sessionCampaignName"] === "(not set)");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            dateRange: { start: startDate, end: endDate },
            summary: {
              totalAdsCampaigns: adsNames.size,
              totalGA4Campaigns: ga4Names.size,
              matchedCount: [...adsNames].filter((n) => ga4Names.has(n)).length,
            },
            issues: {
              adsOnlyNotInGA4: { count: onlyInAds.length, campaigns: onlyInAds, note: "Ads에 있는데 GA4에 없음 — auto-tagging 꺼졌거나 UTM 누락 의심" },
              ga4OnlyNotInAds: { count: onlyInGA4.length, campaigns: onlyInGA4, note: "GA4에서만 보임 — 수동 UTM 오타, 삭제된 캠페인 혼재 의심" },
              notSetSessions: notSet ? { sessions: notSet["sessions"], note: "UTM이 아예 없는 cpc 세션 — auto-tagging 전면 점검 필요" } : null,
            },
          }, null, 2),
        }],
      };
    }
  );

  // #19 캠페인별 상품 카테고리 매출
  server.tool(
    "get_campaign_product_revenue",
    "캠페인별 상품 카테고리 매출 분석 — 어느 캠페인이 어떤 카테고리를 팔고 있는지 파악. 크로스셀/번들 전략 수립용. 이커머스 GA4 필요.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      propertyId: propertyIdSchema,
      customerId: customerIdSchema,
    },
    async ({ startDate, endDate, propertyId, customerId }) => {
      const [ga4Client, adsClient] = await Promise.all([getGA4(), getGAds()]);

      const [categoryData, adsData] = await Promise.all([
        ga4Client.runReport({
          propertyId: resolvePropertyId(propertyId),
          startDate, endDate,
          dimensions: ["sessionCampaignName", "itemCategory"],
          metrics: ["itemRevenue", "itemsPurchased"],
          dimensionFilters: [{ fieldName: "sessionMedium", matchType: "EXACT", value: "cpc" }],
          orderBy: "itemRevenue",
          limit: 500,
        }),
        adsClient.getCampaignPerformance(startDate, endDate, customerId),
      ]);

      // 캠페인별 카테고리 집계
      const campaignMap: Record<string, { categories: Record<string, { revenue: number; items: number }> }> = {};
      for (const row of categoryData.rows as any[]) {
        const campaign = row["sessionCampaignName"] || "(not set)";
        const category = row["itemCategory"] || "(none)";
        if (!campaignMap[campaign]) campaignMap[campaign] = { categories: {} };
        if (!campaignMap[campaign].categories[category]) campaignMap[campaign].categories[category] = { revenue: 0, items: 0 };
        campaignMap[campaign].categories[category].revenue += parseFloat(row["itemRevenue"] || "0");
        campaignMap[campaign].categories[category].items += parseInt(row["itemsPurchased"] || "0", 10);
      }

      const result = adsData.campaigns.map((c: any) => {
        const data = campaignMap[c.campaignName];
        const categories = data
          ? Object.entries(data.categories)
              .sort(([, a], [, b]) => b.revenue - a.revenue)
              .map(([cat, v]) => ({ category: cat, revenue: Math.round(v.revenue * 100) / 100, itemsSold: v.items }))
          : [];
        return { campaignName: c.campaignName, adsCost: c.cost, categories };
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ dateRange: { start: startDate, end: endDate }, campaigns: result }, null, 2),
        }],
      };
    }
  );

  // #21 요일/시간대별 전환율 프로파일
  server.tool(
    "get_conversion_time_profile",
    "요일/시간대별 전환율 및 수익 프로파일 — 언제 광고 집중할지 Ad Schedule 입찰조정 근거 데이터. GA4 전환 기준.",
    {
      startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
      endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
      propertyId: propertyIdSchema,
      groupBy: z.enum(["hour", "dayOfWeek", "both"]).optional().describe("집계 기준: hour(시간대), dayOfWeek(요일), both (기본: both)"),
    },
    async ({ startDate, endDate, propertyId, groupBy = "both" }) => {
      const client = await getGA4();
      const pid = resolvePropertyId(propertyId);

      const [hourData, dayData] = await Promise.all([
        groupBy !== "dayOfWeek" ? client.runReport({
          propertyId: pid, startDate, endDate,
          dimensions: ["hour"],
          metrics: ["sessions", "conversions", "totalRevenue"],
          orderBy: "hour",
          orderDesc: false,
          limit: 24,
        }) : Promise.resolve(null),
        groupBy !== "hour" ? client.runReport({
          propertyId: pid, startDate, endDate,
          dimensions: ["dayOfWeek"],
          metrics: ["sessions", "conversions", "totalRevenue"],
          orderBy: "dayOfWeek",
          orderDesc: false,
          limit: 7,
        }) : Promise.resolve(null),
      ]);

      const DAY_LABELS: Record<string, string> = { "0": "일", "1": "월", "2": "화", "3": "수", "4": "목", "5": "금", "6": "토" };

      const formatRows = (rows: any[], dimKey: string) =>
        rows.map((r) => ({
          [dimKey]: dimKey === "dayOfWeek" ? `${r[dimKey]}(${DAY_LABELS[r[dimKey]] ?? r[dimKey]})` : r[dimKey],
          sessions: parseInt(r["sessions"] || "0", 10),
          conversions: parseFloat(r["conversions"] || "0"),
          revenue: parseFloat(r["totalRevenue"] || "0"),
          conversionRate: parseInt(r["sessions"] || "0", 10) > 0
            ? Math.round((parseFloat(r["conversions"] || "0") / parseInt(r["sessions"] || "0", 10)) * 10000) / 100
            : 0,
        }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            dateRange: { start: startDate, end: endDate },
            note: "conversionRate(%) 높은 시간대/요일에 Google Ads Ad Schedule 입찰가 올리기",
            byHour: hourData ? formatRows(hourData.rows as any[], "hour") : null,
            byDayOfWeek: dayData ? formatRows(dayData.rows as any[], "dayOfWeek") : null,
          }, null, 2),
        }],
      };
    }
  );

} // end if (DEVELOPER_TOKEN)

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export { main };
