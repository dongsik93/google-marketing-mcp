import { OAuth2Client } from "google-auth-library";
import { GoogleAdsApi, Customer } from "google-ads-api";
import * as fs from "fs";

interface ClientCredentials {
  client_id: string;
  client_secret: string;
}

function loadClientCredentials(clientSecretPath: string): ClientCredentials {
  const content = fs.readFileSync(clientSecretPath, "utf-8");
  const json = JSON.parse(content);
  const creds = json.installed || json.web;
  if (!creds) throw new Error("Invalid client_secret.json");
  return creds;
}

function formatMicros(micros: number | string): number {
  return Math.round(Number(micros) / 1_000_000 * 100) / 100;
}

export class GoogleAdsClient {
  private clientSecretPath: string;
  private developerToken: string;
  private customerId: string;
  private loginCustomerId: string;
  private refreshToken: string;
  private api: GoogleAdsApi;

  constructor(
    auth: OAuth2Client,
    clientSecretPath: string,
    developerToken: string,
    customerId: string,
    refreshToken: string,
    loginCustomerId: string = ""
  ) {
    this.clientSecretPath = clientSecretPath;
    this.developerToken = developerToken;
    this.customerId = customerId.replace(/-/g, "");
    this.loginCustomerId = loginCustomerId.replace(/-/g, "");
    this.refreshToken = refreshToken;

    const creds = loadClientCredentials(clientSecretPath);
    this.api = new GoogleAdsApi({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      developer_token: developerToken,
    });
  }

  private getCustomer(customerId?: string): Customer {
    const cid = (customerId || this.customerId).replace(/-/g, "");
    const opts: any = {
      customer_id: cid,
      refresh_token: this.refreshToken,
    };
    if (this.loginCustomerId) {
      opts.login_customer_id = this.loginCustomerId;
    }
    return this.api.Customer(opts);
  }

  async listCampaigns(customerId?: string, includePaused = true) {
    const customer = this.getCustomer(customerId);
    const statusFilter = includePaused
      ? "campaign.status != 'REMOVED'"
      : "campaign.status = 'ENABLED'";

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros
      FROM campaign
      WHERE ${statusFilter}
      ORDER BY campaign.name ASC
    `);

    return {
      count: rows.length,
      campaigns: rows.map((r: any) => ({
        id: String(r.campaign.id),
        name: r.campaign.name,
        status: r.campaign.status,
        channelType: r.campaign.advertising_channel_type,
        biddingStrategy: r.campaign.bidding_strategy_type,
        dailyBudget: r.campaign_budget?.amount_micros
          ? formatMicros(r.campaign_budget.amount_micros)
          : null,
      })),
    };
  }

  async getCampaignPerformance(
    startDate: string,
    endDate: string,
    customerId?: string,
    campaignId?: string
  ) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY metrics.cost_micros DESC
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      count: rows.length,
      campaigns: rows.map((r: any) => ({
        campaignId: String(r.campaign.id),
        campaignName: r.campaign.name,
        status: r.campaign.status,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
        conversionsValue: Math.round(r.metrics.conversions_value * 100) / 100,
        costPerConversion:
          r.metrics.conversions > 0
            ? formatMicros(r.metrics.cost_per_conversion)
            : null,
      })),
    };
  }

  async getKeywordPerformance(
    startDate: string,
    endDate: string,
    customerId?: string,
    campaignId?: string,
    limit = 100
  ) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions
      FROM keyword_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_criterion.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY metrics.clicks DESC
      LIMIT ${limit}
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      count: rows.length,
      keywords: rows.map((r: any) => ({
        keyword: r.ad_group_criterion.keyword.text,
        matchType: r.ad_group_criterion.keyword.match_type,
        campaignName: r.campaign.name,
        adGroupName: r.ad_group.name,
        status: r.ad_group_criterion.status,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
      })),
    };
  }

  async getSearchTerms(
    startDate: string,
    endDate: string,
    customerId?: string,
    campaignId?: string,
    limit = 100
  ) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        campaign.id,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions
      FROM search_term_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY metrics.clicks DESC
      LIMIT ${limit}
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      count: rows.length,
      searchTerms: rows.map((r: any) => ({
        searchTerm: r.search_term_view.search_term,
        status: r.search_term_view.status,
        campaignName: r.campaign.name,
        adGroupName: r.ad_group.name,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
      })),
    };
  }

  async getAdGroupPerformance(
    startDate: string,
    endDate: string,
    customerId?: string,
    campaignId?: string
  ) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion
      FROM ad_group
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY metrics.cost_micros DESC
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      count: rows.length,
      adGroups: rows.map((r: any) => ({
        campaignName: r.campaign.name,
        adGroupId: String(r.ad_group.id),
        adGroupName: r.ad_group.name,
        status: r.ad_group.status,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
        conversionsValue: Math.round(r.metrics.conversions_value * 100) / 100,
        costPerConversion: r.metrics.conversions > 0 ? formatMicros(r.metrics.cost_per_conversion) : null,
      })),
    };
  }

  async getAdPerformance(
    startDate: string,
    endDate: string,
    customerId?: string,
    campaignId?: string,
    limit = 100
  ) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        ad_group_ad.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_ad.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY metrics.clicks DESC
      LIMIT ${limit}
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      count: rows.length,
      ads: rows.map((r: any) => ({
        campaignName: r.campaign.name,
        adGroupName: r.ad_group.name,
        adId: String(r.ad_group_ad.ad.id),
        adName: r.ad_group_ad.ad.name,
        adType: r.ad_group_ad.ad.type,
        finalUrl: r.ad_group_ad.ad.final_urls?.[0] ?? null,
        status: r.ad_group_ad.status,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
        conversionsValue: Math.round(r.metrics.conversions_value * 100) / 100,
      })),
    };
  }

  async getPerformanceByDevice(
    startDate: string,
    endDate: string,
    customerId?: string,
    campaignId?: string
  ) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY metrics.cost_micros DESC
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      byDevice: rows.map((r: any) => ({
        device: r.segments.device,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
        conversionsValue: Math.round(r.metrics.conversions_value * 100) / 100,
      })),
    };
  }

  async getPerformanceByGeo(
    startDate: string,
    endDate: string,
    customerId?: string,
    campaignId?: string,
    limit = 50
  ) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        geographic_view.country_criterion_id,
        geographic_view.location_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions
      FROM geographic_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        ${campaignFilter}
      ORDER BY metrics.clicks DESC
      LIMIT ${limit}
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      count: rows.length,
      byGeo: rows.map((r: any) => ({
        countryCriterionId: r.geographic_view.country_criterion_id,
        locationType: r.geographic_view.location_type,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
      })),
    };
  }

  async getBudgetStatus(customerId?: string) {
    const customer = this.getCustomer(customerId);

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        campaign_budget.total_amount_micros,
        metrics.cost_micros
      FROM campaign
      WHERE campaign.status = 'ENABLED'
      ORDER BY campaign.name ASC
    `);

    return {
      campaigns: rows.map((r: any) => {
        const dailyBudget = r.campaign_budget?.amount_micros ? formatMicros(r.campaign_budget.amount_micros) : null;
        const todayCost = formatMicros(r.metrics.cost_micros);
        const utilizationPercent = dailyBudget && dailyBudget > 0
          ? Math.round((todayCost / dailyBudget) * 10000) / 100
          : null;
        return {
          campaignId: String(r.campaign.id),
          campaignName: r.campaign.name,
          dailyBudget,
          todayCost,
          utilizationPercent,
          remainingBudget: dailyBudget !== null ? Math.round((dailyBudget - todayCost) * 100) / 100 : null,
        };
      }),
    };
  }

  async getImpressionShare(
    startDate: string,
    endDate: string,
    customerId?: string
  ) {
    const customer = this.getCustomer(customerId);

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        metrics.search_impression_share,
        metrics.search_budget_lost_impression_share,
        metrics.search_rank_lost_impression_share,
        metrics.search_top_impression_share,
        metrics.search_absolute_top_impression_share,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        AND campaign.advertising_channel_type = 'SEARCH'
      ORDER BY metrics.impressions DESC
    `);

    return {
      dateRange: { start: startDate, end: endDate },
      campaigns: rows.map((r: any) => ({
        campaignName: r.campaign.name,
        impressionShare: r.metrics.search_impression_share != null
          ? Math.round(r.metrics.search_impression_share * 10000) / 100 : null,
        lostToBudgetPercent: r.metrics.search_budget_lost_impression_share != null
          ? Math.round(r.metrics.search_budget_lost_impression_share * 10000) / 100 : null,
        lostToRankPercent: r.metrics.search_rank_lost_impression_share != null
          ? Math.round(r.metrics.search_rank_lost_impression_share * 10000) / 100 : null,
        topImpressionShare: r.metrics.search_top_impression_share != null
          ? Math.round(r.metrics.search_top_impression_share * 10000) / 100 : null,
        absTopImpressionShare: r.metrics.search_absolute_top_impression_share != null
          ? Math.round(r.metrics.search_absolute_top_impression_share * 10000) / 100 : null,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
      })),
    };
  }

  async getQualityScore(customerId?: string, campaignId?: string) {
    const customer = this.getCustomer(customerId);
    const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";

    const rows = await customer.query(`
      SELECT
        campaign.name,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.quality_info.creative_quality_score,
        ad_group_criterion.quality_info.post_click_quality_score,
        ad_group_criterion.quality_info.search_predicted_ctr
      FROM ad_group_criterion
      WHERE ad_group_criterion.type = 'KEYWORD'
        AND ad_group_criterion.status != 'REMOVED'
        AND campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY ad_group_criterion.quality_info.quality_score ASC
    `);

    return {
      count: rows.length,
      keywords: rows.map((r: any) => ({
        campaignName: r.campaign.name,
        adGroupName: r.ad_group.name,
        keyword: r.ad_group_criterion.keyword.text,
        matchType: r.ad_group_criterion.keyword.match_type,
        qualityScore: r.ad_group_criterion.quality_info?.quality_score ?? null,
        adRelevance: r.ad_group_criterion.quality_info?.creative_quality_score ?? null,
        landingPageExp: r.ad_group_criterion.quality_info?.post_click_quality_score ?? null,
        expectedCtr: r.ad_group_criterion.quality_info?.search_predicted_ctr ?? null,
      })),
    };
  }

  async getAccountSummary(
    startDate: string,
    endDate: string,
    customerId?: string
  ) {
    const customer = this.getCustomer(customerId);

    const rows = await customer.query(`
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY segments.date ASC
    `);

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCostMicros = 0;
    let totalConversions = 0;
    let totalConversionsValue = 0;

    const daily = rows.map((r: any) => {
      totalImpressions += Number(r.metrics.impressions);
      totalClicks += Number(r.metrics.clicks);
      totalCostMicros += Number(r.metrics.cost_micros);
      totalConversions += r.metrics.conversions;
      totalConversionsValue += r.metrics.conversions_value;

      return {
        date: r.segments.date,
        impressions: Number(r.metrics.impressions),
        clicks: Number(r.metrics.clicks),
        cost: formatMicros(r.metrics.cost_micros),
        ctrPercent: Math.round(r.metrics.ctr * 10000) / 100,
        avgCpc: formatMicros(r.metrics.average_cpc),
        conversions: Math.round(r.metrics.conversions * 100) / 100,
      };
    });

    const totalCost = formatMicros(totalCostMicros);
    return {
      dateRange: { start: startDate, end: endDate },
      summary: {
        totalImpressions,
        totalClicks,
        totalCost,
        overallCtrPercent:
          totalImpressions > 0
            ? Math.round((totalClicks / totalImpressions) * 10000) / 100
            : 0,
        avgCpc: totalClicks > 0 ? Math.round((totalCost / totalClicks) * 100) / 100 : 0,
        totalConversions: Math.round(totalConversions * 100) / 100,
        totalConversionsValue: Math.round(totalConversionsValue * 100) / 100,
        costPerConversion:
          totalConversions > 0
            ? Math.round((totalCost / totalConversions) * 100) / 100
            : null,
      },
      dailyBreakdown: daily,
    };
  }
}
