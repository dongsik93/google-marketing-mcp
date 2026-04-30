# Google Analytics 4 Module

> [한국어](./ga4.ko.md) · [← Back to root](../../README.md)

Activated by setting `GA4_PROPERTY_ID`.

## Tools

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

## Setup

### 1. Enable APIs in Google Cloud Console

- **Google Analytics Data API**
- **Google Analytics Admin API**

### 2. Find your Property ID

1. Go to [Google Analytics](https://analytics.google.com)
2. Bottom left **Admin (gear icon)** → **Property Settings**
3. The **Property ID** is the numeric ID at the top (e.g. `417304962`)

### 3. Environment variables

| Variable | Required | Description |
|---|---|---|
| `GA4_PROPERTY_ID` | ✅ | Default GA4 Property ID. Setting this enables the module |

## Usage Examples

- "Show me sessions and new users by date for the last 7 days"
- "Break down traffic sources for this month"
- "How many users are active right now?"
- "Show top 10 pages by pageviews for the last 30 days"
- "Compare campaign A vs campaign B last month"

## Common Dimensions & Metrics

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
