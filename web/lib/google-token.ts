import { getToken } from "next-auth/jwt";
import { refreshGoogleAccessToken } from "@/lib/google-oauth";

// Auth.js v5 のセッション Cookie 名（dev は非セキュア、prod は __Secure- 接頭辞）
function cookieConfig() {
  const secureCookie = (process.env.AUTH_URL ?? "").startsWith("https://");
  const cookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  return { secureCookie, cookieName };
}

export type AccessTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false };

/**
 * リクエストの JWT（httpOnly Cookie）からアクセストークンを取り出す。
 * 期限切れなら refresh_token でその場でリフレッシュする。
 * トークンはサーバー側でのみ扱い、クライアントには返さない。
 */
export async function getValidAccessToken(
  req: Request,
): Promise<AccessTokenResult> {
  const { secureCookie, cookieName } = cookieConfig();
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
    secureCookie,
    cookieName,
  });

  if (!token) return { ok: false };

  // 有効期限内のアクセストークンがあればそのまま使う
  if (
    token.access_token &&
    typeof token.expires_at === "number" &&
    Date.now() < token.expires_at * 1000
  ) {
    return { ok: true, accessToken: token.access_token };
  }

  // 期限切れ: refresh_token でリフレッシュ
  if (token.refresh_token) {
    const refreshed = await refreshGoogleAccessToken(token.refresh_token);
    if ("access_token" in refreshed) {
      return { ok: true, accessToken: refreshed.access_token };
    }
  }

  return { ok: false };
}
