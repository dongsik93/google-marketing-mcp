# Google Ads Module

> [한국어](./ads.ko.md) · [← Back to root](../../README.md)

Activated by setting `GOOGLE_ADS_DEVELOPER_TOKEN`.

## Tools

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

## Setup

### 1. Enable APIs in Google Cloud Console

- **Google Ads API**

### 2. Get a Developer Token

1. Sign in to [Google Ads](https://ads.google.com/)
2. Click the tools icon (top right) → **API Center**
3. Apply for a Developer Token
   - Test accounts: approved immediately
   - Production accounts: requires Google review

### 3. Find your Customer ID

1. Sign in to [Google Ads](https://ads.google.com/)
2. Customer ID is shown in the top right (`xxx-xxx-xxxx` format)
3. Use digits only — no dashes (e.g. `1234567890`)

### 4. Environment variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ✅ | Developer Token. Setting this enables the module |
| `GOOGLE_ADS_CUSTOMER_ID` | Optional | Default Customer ID (digits only) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Optional | MCC (manager account) ID. Required when accessing a client account through a manager |

## Usage Examples

- "Show me all active campaigns"
- "What's the campaign performance for this month? Show impressions, clicks, cost, and conversions"
- "Show top 50 keywords by clicks for the last 30 days"
- "Give me an account summary for January"
- "Which keywords have low quality scores?"
- "Show search terms report for last 7 days"
