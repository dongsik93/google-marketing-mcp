# Google Search Console Module

> [한국어](./gsc.ko.md) · [← Back to root](../../README.md)

Activated by setting `GSC_SITE_URL`.

## Tools

| Tool | Description |
|---|---|
| `gsc_list_sites` | List all Search Console sites you have access to |
| `gsc_query` | Search Analytics query — flexible dimension/filter combinations (query, page, country, device, searchAppearance, date) |
| `gsc_top_queries` | Top search queries by impressions — what terms surface your site in Google |
| `gsc_top_pages` | Top pages by impressions — which articles get the most search exposure |
| `gsc_queries_by_page` | Queries that drove traffic to a specific page |
| `gsc_inspect_url` | URL inspection — index status, mobile usability, last crawl date |
| `gsc_list_sitemaps` | List submitted sitemaps with status, errors, warnings |

## Setup

### 1. Enable APIs in Google Cloud Console

- **Search Console API**

### 2. Find your Site URL

- **URL prefix property**: `https://example.com/` (with trailing slash)
- **Domain property**: `sc-domain:example.com`

### 3. Environment variables

| Variable | Required | Description |
|---|---|---|
| `GSC_SITE_URL` | ✅ | Search Console site URL. Setting this enables the module |

## Usage Examples

- "What are the top 20 search queries that brought traffic last 28 days?"
- "Which pages get the most search impressions?"
- "Show me the queries that drove visitors to /my-best-article/"
- "Inspect the indexing status of https://example.com/recent-post/"
- "List all submitted sitemaps and their status"

## Available Dimensions

| Value | Description |
|---|---|
| `query` | Search query |
| `page` | Landing page |
| `country` | Country |
| `device` | Device type (desktop / mobile / tablet) |
| `searchAppearance` | Search feature (AMP, FAQ, Video, etc.) |
| `date` | Date |
