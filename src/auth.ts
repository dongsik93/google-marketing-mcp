import { OAuth2Client, Credentials } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import open from "open";

const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const YT_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
const YT_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/yt-analytics.readonly";

export type AuthProfile = "default" | "youtube";

const TOKEN_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".google-marketing-mcp"
);

function tokenPath(profile: AuthProfile): string {
  return profile === "youtube"
    ? path.join(TOKEN_DIR, "token.youtube.json")
    : path.join(TOKEN_DIR, "token.json");
}

interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

function loadClientCredentials(clientSecretPath: string): ClientCredentials {
  const content = fs.readFileSync(clientSecretPath, "utf-8");
  const json = JSON.parse(content);
  const creds = json.installed || json.web;
  if (!creds) {
    throw new Error(
      "client_secret.json must contain 'installed' or 'web' credentials"
    );
  }
  return creds;
}

function loadSavedToken(profile: AuthProfile): any | null {
  try {
    const content = fs.readFileSync(tokenPath(profile), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function saveToken(token: any, profile: AuthProfile): void {
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
  fs.writeFileSync(tokenPath(profile), JSON.stringify(token, null, 2));
}

/**
 * refresh 응답에는 보통 refresh_token이 포함되지 않으므로,
 * 기존 토큰의 refresh_token/scope를 보존하며 새 credentials를 머지한다.
 */
function mergeCredentials(prev: any, next: Credentials): any {
  return {
    ...prev,
    ...next,
    refresh_token: next.refresh_token || prev?.refresh_token,
    scope: next.scope || prev?.scope,
  };
}

/**
 * google-auth-library가 access token을 자동 갱신할 때마다
 * 디스크에 최신 credentials를 영속화한다. 장수 세션에서 필수.
 */
function attachAutoRefresh(
  oauth2Client: OAuth2Client,
  profile: AuthProfile
): void {
  oauth2Client.on("tokens", (tokens) => {
    const current = loadSavedToken(profile) || {};
    const merged = mergeCredentials(current, tokens);
    try {
      saveToken(merged, profile);
    } catch (err) {
      console.error(`[auth:${profile}] failed to persist refreshed token`, err);
    }
  });
}

function tokenHasScope(token: any, scope: string): boolean {
  if (!token?.scope) return false;
  return token.scope.includes(scope);
}

/**
 * 프로필별 scope 빌드.
 *  - "default": GA4/GSC/Ads 묶음. 기존 사용자 호환을 위해 유지.
 *    YT 환경변수가 있어도 default 토큰엔 YT scope를 추가하지 않는다 (별도 토큰 사용).
 *  - "youtube": YT readonly + YT Analytics. 별도 OAuth 흐름 (Brand Account 대응).
 */
function buildScopes(profile: AuthProfile): string[] {
  const scopes: string[] = [];

  if (profile === "youtube") {
    scopes.push(YT_SCOPE);
    scopes.push(YT_ANALYTICS_SCOPE);
    return scopes;
  }

  // default profile
  const enableGA4 = !!process.env.GA4_PROPERTY_ID;
  const enableGSC = !!process.env.GSC_SITE_URL;
  const enableAds = !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (enableGA4) scopes.push(GA4_SCOPE);
  if (enableGSC) scopes.push(GSC_SCOPE);
  if (enableAds) scopes.push(ADS_SCOPE);

  if (scopes.length === 0) {
    // 아무것도 활성화 안 됨 — GA4 디폴트로 (기존 사용자 호환)
    scopes.push(GA4_SCOPE);
  }
  return scopes;
}

async function authorizeViaLocalServer(
  oauth2Client: OAuth2Client,
  scopes: string[],
  profile: AuthProfile
): Promise<void> {
  // YouTube 프로필은 항상 계정 선택 화면을 강제 (Brand Account 선택 가능하도록).
  // default 프로필은 기존 동작 유지 (consent only).
  const promptValue = profile === "youtube" ? "select_account consent" : "consent";

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: promptValue,
  });

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url!, `http://localhost:3000`);
        const code = url.searchParams.get("code");

        if (!code) {
          res.writeHead(400);
          res.end("No authorization code received");
          return;
        }

        const { tokens } = await oauth2Client.getToken(code);
        const prev = loadSavedToken(profile);
        const merged = mergeCredentials(prev, tokens);
        oauth2Client.setCredentials(merged);
        saveToken(merged, profile);

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          `<h1>인증 완료! (${profile})</h1><p>이 창을 닫아도 됩니다.</p><script>window.close()</script>`
        );

        server.close();
        resolve();
      } catch (err) {
        res.writeHead(500);
        res.end("Authentication failed");
        server.close();
        reject(err);
      }
    });

    server.listen(3000, () => {
      open(authUrl).catch(() => {
        console.error(`Open this URL in your browser:\n${authUrl}`);
      });
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Authentication timed out"));
    }, 120000);
  });
}

/**
 * 프로필별 OAuth 클라이언트 반환.
 * profile="default" → token.json (GA4/GSC/Ads)
 * profile="youtube" → token.youtube.json (YouTube 전용, Brand Account 대응)
 */
export async function getAuthenticatedClient(
  clientSecretPath: string,
  profile: AuthProfile = "default"
): Promise<OAuth2Client> {
  const creds = loadClientCredentials(clientSecretPath);
  const scopes = buildScopes(profile);

  const oauth2Client = new OAuth2Client(
    creds.client_id,
    creds.client_secret,
    "http://localhost:3000"
  );

  // 자동 갱신 토큰 영속화는 신규/기존 인증 모두에 필요하므로 최상단에서 한 번만 부착.
  attachAutoRefresh(oauth2Client, profile);

  const savedToken = loadSavedToken(profile);
  if (savedToken) {
    // 활성화한 모듈의 스코프가 기존 토큰에 빠져있으면 재인증.
    const missingScope = scopes.find((s) => !tokenHasScope(savedToken, s));
    if (missingScope) {
      await authorizeViaLocalServer(oauth2Client, scopes, profile);
      return oauth2Client;
    }

    // refresh_token만 있어도 라이브러리가 호출 시점에 알아서 access_token을 갱신한다.
    // expiry_date가 없거나 만료되어도 setCredentials 후 다음 API 호출이 자동 refresh를 유발.
    oauth2Client.setCredentials(savedToken);

    // refresh_token 자체가 폐기/회수된 경우만 재인증 강제.
    // 일반 만료는 라이브러리에 맡긴다 (자동 refresh + tokens 이벤트로 디스크 동기화).
    if (!savedToken.refresh_token) {
      await authorizeViaLocalServer(oauth2Client, scopes, profile);
    }

    return oauth2Client;
  }

  await authorizeViaLocalServer(oauth2Client, scopes, profile);
  return oauth2Client;
}

/**
 * API 호출 중 401/invalid_grant 등 인증 에러를 만났을 때 호출하면,
 * 토큰을 강제로 한 번 refresh 시도한다. 실패 시 false 반환.
 * 호출부에서 false면 사용자에게 재인증 안내를 노출하는 게 좋다.
 */
export async function forceRefresh(
  oauth2Client: OAuth2Client,
  profile: AuthProfile = "default"
): Promise<boolean> {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const prev = loadSavedToken(profile);
    const merged = mergeCredentials(prev, credentials);
    oauth2Client.setCredentials(merged);
    saveToken(merged, profile);
    return true;
  } catch (err) {
    console.error(`[auth:${profile}] forceRefresh failed`, err);
    return false;
  }
}

export function getRefreshToken(): string {
  const token = loadSavedToken("default");
  if (!token?.refresh_token) {
    throw new Error("No refresh token found. Run authentication first.");
  }
  // Ads scope가 없는 토큰으로 Ads를 쓰려는 경우 명확한 에러
  if (!tokenHasScope(token, ADS_SCOPE)) {
    throw new Error(
      "Google Ads 권한이 없습니다. GOOGLE_ADS_DEVELOPER_TOKEN을 설정한 뒤 재인증이 필요합니다. " +
      "~/.google-marketing-mcp/token.json 을 삭제하고 서버를 재시작하세요."
    );
  }
  return token.refresh_token;
}
