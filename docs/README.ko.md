# google-marketing-mcp

[![npm](https://img.shields.io/npm/v/@dongsik/google-marketing-mcp)](https://www.npmjs.com/package/@dongsik/google-marketing-mcp)

[English](../README.md)

Claude Desktop에서 **Google Analytics 4**, **Google Search Console**, **Google Ads**, **YouTube (Data + Analytics)** 데이터를 자연어로 조회할 수 있는 MCP 서버입니다.

각 모듈은 환경변수로 독립적으로 활성화됩니다 — 원하는 모듈만 골라서 사용하세요.

```bash
npx -y @dongsik/google-marketing-mcp
```

## 모듈

| 모듈 | 활성 환경변수 | 도구 수 | 문서 |
|---|---|---|---|
| **Google Analytics 4** | `GA4_PROPERTY_ID` | 20 | [문서](./modules/ga4.ko.md) |
| **Google Search Console** | `GSC_SITE_URL` | 7 | [문서](./modules/gsc.ko.md) |
| **Google Ads** | `GOOGLE_ADS_DEVELOPER_TOKEN` | 12 | [문서](./modules/ads.ko.md) |
| **YouTube** (Data + Analytics) | `YT_CHANNEL_ID` | 16 | [문서](./modules/youtube.ko.md) |
| **GA4 × Ads 통합** | 위 둘 다 | 7 | [문서](./modules/combined.ko.md) |

## 공통 설정

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성/선택
2. **API 및 서비스 → 라이브러리** → 사용할 모듈의 API 활성화 (각 모듈 문서 참조)
3. **API 및 서비스 → OAuth 동의 화면**
   - 사용자 유형: **외부(External)**
   - 테스트 사용자에 본인 Google 계정 추가
4. **API 및 서비스 → 사용자 인증 정보** → **OAuth 2.0 클라이언트 ID** 생성
   - 애플리케이션 유형: **데스크톱 앱**
5. JSON 파일 다운로드 → `client_secret.json` 으로 저장

### 2. Claude Desktop 설정

`claude_desktop_config.json` 에 추가:

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
        "GOOGLE_ADS_DEVELOPER_TOKEN": "발급받은_토큰",
        "YT_CHANNEL_ID": "UCxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

> 사용할 모듈의 환경변수만 설정하면 됩니다 — OAuth 권한 요청도 해당 스코프만 요구합니다.
> **Windows 경로 예시:** `"C:\\Users\\사용자이름\\client_secret.json"`

### 3. 공통 환경변수

| 변수 | 설명 |
|---|---|
| `GA_CLIENT_SECRET_PATH` | `client_secret.json` 절대 경로 (필수) |

모듈별 환경변수는 각 모듈 문서에 정리돼 있습니다.

### 4. 최초 실행

처음 실행 시 브라우저가 자동으로 열려 Google 계정 로그인을 요청합니다. 인증 후 토큰이 `~/.google-marketing-mcp/token.json` 에 저장되어 이후 자동 인증됩니다.

새 모듈을 추가하면 OAuth 플로우가 다시 한 번 돌아 추가 스코프를 요청합니다.

## License

MIT
