import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import open from "open";

const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

const TOKEN_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".google-marketing-mcp"
);
const TOKEN_PATH = path.join(TOKEN_DIR, "token.json");

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

function loadSavedToken(): any | null {
  try {
    const content = fs.readFileSync(TOKEN_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function saveToken(token: any): void {
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

function tokenHasScope(token: any, scope: string): boolean {
  if (!token?.scope) return false;
  return token.scope.includes(scope);
}

function buildScopes(): string[] {
  const scopes = [GA4_SCOPE];
  // Developer Token이 설정된 경우에만 Ads scope 요청
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    scopes.push(ADS_SCOPE);
  }
  return scopes;
}

async function authorizeViaLocalServer(
  oauth2Client: OAuth2Client,
  scopes: string[]
): Promise<void> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
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
        oauth2Client.setCredentials(tokens);
        saveToken(tokens);

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>인증 완료!</h1><p>이 창을 닫아도 됩니다.</p><script>window.close()</script>"
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

export async function getAuthenticatedClient(
  clientSecretPath: string
): Promise<OAuth2Client> {
  const creds = loadClientCredentials(clientSecretPath);
  const scopes = buildScopes();

  const oauth2Client = new OAuth2Client(
    creds.client_id,
    creds.client_secret,
    "http://localhost:3000"
  );

  const savedToken = loadSavedToken();
  if (savedToken) {
    // Ads scope가 필요한데 기존 토큰에 없으면 재인증
    const needsAds = scopes.includes(ADS_SCOPE);
    const hasAds = tokenHasScope(savedToken, ADS_SCOPE);

    if (needsAds && !hasAds) {
      // Ads가 새로 추가된 경우 재인증
      await authorizeViaLocalServer(oauth2Client, scopes);
      return oauth2Client;
    }

    oauth2Client.setCredentials(savedToken);

    if (savedToken.expiry_date && savedToken.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        saveToken(credentials);
      } catch {
        await authorizeViaLocalServer(oauth2Client, scopes);
      }
    }

    return oauth2Client;
  }

  await authorizeViaLocalServer(oauth2Client, scopes);
  return oauth2Client;
}

export function getRefreshToken(): string {
  const token = loadSavedToken();
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
