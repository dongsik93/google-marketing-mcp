# Changelog

## 0.4.2 — 2026-04-30

### Added

- `status` common tool: reports enabled modules and configured env values without exposing secrets.
- `yt_resolve_channel`: resolves a YouTube `@handle`, channel URL, or `UC...` channel ID to channel metadata. Useful before setting `YT_CHANNEL_ID`.
- `check_youtube_ga4_traffic`: GA4 helper that filters sessions related to YouTube/Shorts traffic (`youtube`, `youtu.be`, `shorts`) across source, medium, campaign, and landing page.

### Compatibility

- No existing tool names, environment variables, token paths, or module activation rules were removed.
- `check_youtube_ga4_traffic` is registered only when GA4 is active, preserving the previous behavior for YouTube-only/GSC-only/Ads-only users.

## 0.4.1 — 2026-04-30

- Docs only: add CHANGELOG and migration notes to root READMEs (en/ko) so v0.3.0 → v0.4.0 upgraders see the YouTube re-auth note.

## 0.4.0 — 2026-04-30

### Breaking-ish (YouTube users only)

- **YouTube auth is now isolated** in a separate token file (`~/.google-marketing-mcp/token.youtube.json`). GA4/GSC/Ads continue using `token.json`.
- **First YouTube call after upgrading triggers OAuth once**, even if you already authorized YouTube on v0.3.0. GA4/GSC/Ads tokens are untouched.
- The OAuth screen for YouTube now uses `prompt=select_account`, so you can choose a Brand Account that owns the channel without conflicting with the personal Google account used by GA/GSC.

### Why
Many channels are owned by **Google Brand Accounts** while GA4/GSC are scoped to a personal Gmail. Sharing one OAuth token forced both into the same context and broke YouTube Analytics with `Forbidden`. Splitting profiles fixes this.

### Migration
- **GA4/GSC/Ads only users**: nothing to do. Upgrade is transparent.
- **v0.3.0 YouTube users**: re-authorize once on the first YouTube tool call after upgrading. Pick the Brand Account in the new account-selection screen.
- **Brand Account caveats**: if the consent screen says "this service is not available", your OAuth client is in **Testing** mode. Add the Brand Account email to **Test users** at [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent), or push the app to production.

---

## 0.3.0 — 2026-04-30

- **YouTube module added** (Data API v3 + Analytics API v2): 16 tools covering channel/video catalog, search, retention curve, traffic sources, search terms, demographics, country/device split, daily trend, top videos, playlists, and a generic Analytics report.
- Activated by `YT_CHANNEL_ID` environment variable.
- Docs split per module under `docs/modules/{ga4,gsc,ads,youtube,combined}.{md,ko.md}` so the root README stays a short index.

---

## 0.2.0 — 2026-04

- Google Search Console module added.

## 0.1.x

- Initial release with Google Analytics 4 + Google Ads modules.
