# google-marketing-mcp

[![npm](https://img.shields.io/npm/v/@dongsik/google-marketing-mcp)](https://www.npmjs.com/package/@dongsik/google-marketing-mcp)

[한국어](docs/README.ko.md)

An MCP server for querying Google Analytics 4 and Google Ads data directly from Claude Desktop.

```bash
npx -y @dongsik/google-marketing-mcp
```

## Features

### Google Analytics 4

**Basic**
| Tool | Description |
|---|---|
| `list_accounts` | List GA4 accounts |
| `list_properties` | List properties within an account |
| `run_report` | Run custom reports with flexible metric/dimension combinations and dimension filters |

**Page & Traffic**
| Tool | Description |
|---|---|
| `get_top_pages` | Top pages by pageviews, sessions, avg. duration, bounce rate |
| `get_traffic_sources` | Traffic source breakdown by source/medium |

**User Analysis**
| Tool | Description |
|---|---|
| `get_user_overview` | User overview (total users, new users, sessions, pageviews, etc.) |
| `get_users_by_country` | Users by country |
| `get_users_by_device` | Users by device category (desktop, mobile, tablet) |

**Trends & Realtime**
| Tool | Description |
|---|---|
| `get_trend_by_date` | Daily trends (pageviews, sessions, users over time) |
| `get_realtime` | Realtime active users and pageviews |
| `compare_periods` | Period-over-period comparison (WoW, MoM, YoY) |

**Campaign Analysis**
| Tool | Description |
|---|---|
| `get_ga4_campaign_performance` | Campaign performance (sessions, users, conversions, bounce rate). Filter by campaign name |
| `get_utm_breakdown` | Full UTM parameter analysis (campaign, source, medium, content, keyword) |
| `compare_campaigns` | Compare performance across multiple campaigns |
| `get_landing_page_performance` | Landing page performance by source/medium/campaign (sessions, bounce rate, conversions) |
| `get_conversions_by_event` | Conversions and revenue by event name (purchase, sign_up, lead, etc.) |
| `get_ecommerce_summary` | Ecommerce summary — revenue, transactions, AOV, purchase rate |

**Metadata**
| Tool | Description |
|---|---|
| `get_metadata` | List all available metrics and dimensions |
| `search_metadata` | Search metrics/dimensions by keyword |
| `list_categories` | List metric/dimension categories |

### Google Ads

**Campaign & Ad Structure**
| Tool | Description |
|---|---|
| `ads_list_campaigns` | List all campaigns with status, channel type, and daily budget |
| `ads_get_campaign_performance` | Campaign performance by date range (impressions, clicks, cost, CTR, CPC, conversions) |
| `ads_get_ad_group_performance` | Ad group level performance |
| `ads_get_ad_performance` | Individual ad creative performance — for A/B testing |
| `ads_get_keyword_performance` | Keyword performance, optionally filtered by campaign |
| `ads_get_search_terms` | **Search terms report** — actual queries users typed. Essential for negative keyword discovery |
| `ads_get_account_summary` | Account-level summary with daily breakdown |

**Optimization & Competitive**
| Tool | Description |
|---|---|
| `ads_get_performance_by_device` | Performance breakdown by device (MOBILE / DESKTOP / TABLET) |
| `ads_get_performance_by_geo` | Performance breakdown by geography |
| `ads_get_budget_status` | Today's budget utilization and remaining budget per campaign |
| `ads_get_impression_share` | Search impression share — budget/rank loss breakdown |
| `ads_get_quality_score` | Keyword quality scores — ad relevance, landing page exp, expected CTR |

### GA4 + Google Ads Combined

| Tool | Description |
|---|---|
| `get_roas_by_campaign` | ROAS by campaign — joins Ads cost with GA4 revenue by campaign name |
| `get_click_session_gap` | Click vs session gap analysis — detects bot traffic, UTM loss, landing errors by campaign |
| `get_new_vs_returning_by_campaign` | New vs returning user ratio per campaign — measures true acquisition efficiency and CAC |
| `get_hourly_traffic_vs_budget` | GA4 hourly traffic vs Ads budget utilization — finds peak hours after budget runs out |
| `get_utm_integrity_check` | UTM tag integrity check — detects mismatched campaign names between Ads and GA4 |
| `get_campaign_product_revenue` | Campaign × product category revenue — identifies which campaigns drive which categories |
| `get_conversion_time_profile` | Conversion rate by hour/day of week — Ad Schedule bid adjustment data |

## Prerequisites

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project
2. **APIs & Services → Library** → Enable the following APIs:
   - **Google Analytics Data API**
   - **Google Analytics Admin API**
   - **Google Ads API**
3. **APIs & Services → OAuth consent screen**
   - Set User Type to **External**
   - Add your Google account as a test user
4. **APIs & Services → Credentials** → Create **OAuth 2.0 Client ID**
   - Application type: **Desktop app**
5. Download the JSON file → save it as `client_secret.json`

### 2. Google Ads Developer Token

1. Go to [Google Ads](https://ads.google.com/) and sign in
2. Click the tools icon (top right) → **API Center**
3. Apply for a Developer Token
   - Test accounts: approved immediately
   - Production accounts: requires review by Google
4. Copy the token — you'll need it for configuration

### 3. Find Your IDs

**GA4 Property ID**
1. Go to [Google Analytics](https://analytics.google.com)
2. Bottom left **Admin (gear icon)** → **Property Settings**
3. The **Property ID** is the numeric ID at the top (e.g. `417304962`)

**Google Ads Customer ID**
1. Sign in to [Google Ads](https://ads.google.com/)
2. Your Customer ID is shown in the top right corner in `xxx-xxx-xxxx` format
3. Use digits only — no dashes (e.g. `1234567890`)

## Installation

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

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
        "GOOGLE_ADS_DEVELOPER_TOKEN": "your_developer_token"
      }
    }
  }
}
```

> **Windows path example:** `"C:\\Users\\username\\client_secret.json"`

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GA_CLIENT_SECRET_PATH` | Yes | Absolute path to your OAuth `client_secret.json` |
| `GA4_PROPERTY_ID` | No | Default GA4 Property ID. If set, you don't need to pass it per request |
| `GOOGLE_ADS_CUSTOMER_ID` | No | Default Google Ads Customer ID (digits only). If set, you don't need to pass it per request |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Yes | Google Ads API Developer Token |

### First Run

On first launch, a browser window will open for Google OAuth login. After authentication, the token is saved locally — subsequent requests will authenticate automatically.

## Usage Examples

Ask in natural language through Claude Desktop:

**GA4**
- "Show me sessions and new users by date for the last 7 days"
- "Break down traffic sources for this month"
- "How many users are active right now?"
- "List all GA4 properties I have access to"
- "Show top 10 pages by pageviews for the last 30 days"

**Google Ads**
- "Show me all active campaigns"
- "What's the campaign performance for this month? Show impressions, clicks, cost, and conversions"
- "Show top 50 keywords by clicks for the last 30 days"
- "Give me an account summary for January"
- "How much did we spend on campaign X last week?"

## Available GA4 Dimensions & Metrics

**Dimensions**

| Value | Description |
|---|---|
| `date` | Date |
| `city` / `country` | City / Country |
| `deviceCategory` | Device type (desktop / mobile / tablet) |
| `sessionSource` / `sessionMedium` | Traffic source / medium |
| `sessionCampaignName` | Campaign name |
| `pagePath` / `pageTitle` | Page path / title |

**Metrics**

| Value | Description |
|---|---|
| `sessions` | Sessions |
| `activeUsers` | Active users |
| `newUsers` | New users |
| `bounceRate` | Bounce rate |
| `averageSessionDuration` | Avg. session duration (seconds) |
| `screenPageViews` | Pageviews |
| `conversions` | Conversions |
| `totalRevenue` | Total revenue |
| `engagementRate` | Engagement rate |

## License

MIT
