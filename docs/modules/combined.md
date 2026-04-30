# GA4 + Google Ads Combined Tools

> [한국어](./combined.ko.md) · [← Back to root](../../README.md)

These tools cross-reference GA4 and Google Ads data. They activate automatically when **both** `GA4_PROPERTY_ID` and `GOOGLE_ADS_DEVELOPER_TOKEN` are set.

## Tools

| Tool | Description |
|---|---|
| `get_roas_by_campaign` | ROAS by campaign — joins Ads cost with GA4 revenue by campaign name |
| `get_click_session_gap` | Click vs session gap analysis — detects bot traffic, UTM loss, landing errors by campaign |
| `get_new_vs_returning_by_campaign` | New vs returning user ratio per campaign — measures true acquisition efficiency and CAC |
| `get_hourly_traffic_vs_budget` | GA4 hourly traffic vs Ads budget utilization — finds peak hours after budget runs out |
| `get_utm_integrity_check` | UTM tag integrity check — detects mismatched campaign names between Ads and GA4 |
| `get_campaign_product_revenue` | Campaign × product category revenue — identifies which campaigns drive which categories |
| `get_conversion_time_profile` | Conversion rate by hour/day of week — Ad Schedule bid adjustment data |

## Setup

Enable both modules:

- [GA4 setup](./ga4.md)
- [Google Ads setup](./ads.md)

Combined tools auto-register when both environment variables are present.

## Usage Examples

- "Calculate ROAS for all campaigns last month"
- "Which campaigns have suspicious click-to-session gaps?"
- "Show me cost per new user by campaign"
- "Are there peak traffic hours where my budget runs out?"
- "Check UTM tag integrity between Ads and GA4"
- "What product categories does each campaign drive?"
- "Show conversion rate profile by hour and day of week"
