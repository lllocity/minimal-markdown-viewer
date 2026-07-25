import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// 要求するスコープ: OIDC 基本情報 + Drive の閲覧のみ（読むだけ・書き込みなし）
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
].join(" ");

// Google のトークンエンドポイント（リフレッシュに使用）
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      // clientId / clientSecret は AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET から自動取得される
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          // refresh_token を得るためにオフラインアクセス + 同意を毎回要求
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // JWT にトークン一式を保持し、期限切れ時はサーバー側でリフレッシュする
    async jwt({ token, account }) {
      // 初回ログイン時のみ account にトークンが入る
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = account.expires_at;
        return token;
      }

      // アクセストークンがまだ有効ならそのまま使う
      if (
        typeof token.expires_at === "number" &&
        Date.now() < token.expires_at * 1000
      ) {
        return token;
      }

      // 期限切れ: refresh_token が無ければ再ログインが必要
      if (!token.refresh_token) {
        token.error = "NoRefreshToken";
        return token;
      }

      // 期限切れ: refresh_token で新しいアクセストークンを取得
      try {
        const res = await fetch(GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
          }),
        });

        const refreshed = await res.json();
        if (!res.ok) throw refreshed;

        token.access_token = refreshed.access_token;
        token.expires_at =
          Math.floor(Date.now() / 1000) + Number(refreshed.expires_in);
        // Google が新しい refresh_token を返した場合のみ更新
        if (refreshed.refresh_token) {
          token.refresh_token = refreshed.refresh_token;
        }
        token.error = undefined;
        return token;
      } catch {
        token.error = "RefreshTokenError";
        return token;
      }
    },

    // クライアントに返すセッションにはアクセストークンを含めない（サーバー側のみで保持）
    async session({ session, token }) {
      session.error = token.error;
      return session;
    },
  },
});
