// Google OAuth トークンのリフレッシュ処理（auth.ts と Drive のトークン取得で共用）

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type RefreshResult =
  | { access_token: string; expires_at: number; refresh_token?: string }
  | { error: "RefreshTokenError" };

/**
 * refresh_token から新しいアクセストークンを取得する。
 * Google の標準 Web フローでは refresh_token は原則ローテーションされない（長寿命）。
 */
export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<RefreshResult> {
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw data;

    return {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + Number(data.expires_in),
      // Google が新しい refresh_token を返した場合のみ含む
      refresh_token: data.refresh_token,
    };
  } catch {
    return { error: "RefreshTokenError" };
  }
}
