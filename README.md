# google-marketing-mcp

[![npm](https://img.shields.io/npm/v/@dongsik/google-marketing-mcp)](https://www.npmjs.com/package/@dongsik/google-marketing-mcp)

[한국어](./docs/README.ko.md)

An MCP server for querying **Google Analytics 4**, **Google Search Console**, **Google Ads**, and **YouTube (Data + Analytics)** data directly from Claude Desktop.

Each module is independently activated by environment variables — pick any subset.

```bash
npx -y @dongsik/google-marketing-mcp
```

> **v0.4.0 note** — YouTube now uses a **separate OAuth token** (`token.youtube.json`) so it can authorize against a Brand Account without conflicting with the personal Google account used by GA4/GSC. GA4/GSC/Ads users are unaffected. v0.3.0 YouTube users re-authorize once on the next YouTube call. See [CHANGELOG](./CHANGELOG.md).

> **v0.4.2 note** — Adds non-breaking helper tools: `status`, `yt_resolve_channel`, and `check_youtube_ga4_traffic`.

## Modules

| Module | Activates with | Tools | Docs |
|---|---|---|---|
| **Common** | always | 1 | this README |
| **Google Analytics 4** | `GA4_PROPERTY_ID` | 21 | [docs](./docs/modules/ga4.md) |
| **Google Search Console** | `GSC_SITE_URL` | 7 | [docs](./docs/modules/gsc.md) |
| **Google Ads** | `GOOGLE_ADS_DEVELOPER_TOKEN` | 12 | [docs](./docs/modules/ads.md) |
| **YouTube** (Data + Analytics) | `YT_CHANNEL_ID` | 17 | [docs](./docs/modules/youtube.md) |
| **GA4 × Ads combined** | both above | 7 | [docs](./docs/modules/combined.md) |

Common helper:

- `status`: checks which modules are enabled and which env values are configured without printing secrets.

## Common Setup

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project
2. **APIs & Services → Library** → enable the APIs for the modules you'll use (see each module's docs)
3. **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - Add your Google account as a test user
4. **APIs & Services → Credentials** → create **OAuth 2.0 Client ID**
   - Application type: **Desktop app**
5. Download the JSON file → save it as `client_secret.json`

### 2. Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-marketing-mcp": {
      "command": "npx",
      "args": ["--package=@dongsik/google-marketing-mcp", "google-marketing-mcp"],
      "env": {
        "GA_CLIENT_SECRET_PATH": "/path/to/client_secret.json",
        "GA4_PROPERTY_ID": "123456789",
        "GSC_SITE_URL": "https://example.com/",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "your_developer_token",
        "YT_CHANNEL_ID": "UCxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

> Set only the env variables for modules you actually use. The OAuth scope request asks only for what's needed.
> **Windows path example:** `"C:\\Users\\username\\client_secret.json"`

### 3. Common Environment Variables

| Variable | Description |
|---|---|
| `GA_CLIENT_SECRET_PATH` | Absolute path to your OAuth `client_secret.json` (required) |

Module-specific env variables are documented in each module's page (linked above).

### 4. First Run

On first launch, a browser window opens for Google OAuth login. After authentication, the token is saved at `~/.google-marketing-mcp/token.json` — subsequent requests authenticate automatically.

If you add a new module after the first run, the OAuth flow runs again to request the new scope.

## License

MIT
