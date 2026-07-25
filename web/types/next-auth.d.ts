import "next-auth";
import "next-auth/jwt";

type AuthError = "NoRefreshToken" | "RefreshTokenError";

declare module "next-auth" {
  // クライアントに渡すセッション: 認証情報は載せず、エラー状態のみ
  interface Session {
    error?: AuthError;
  }
}

declare module "next-auth/jwt" {
  // サーバー側の JWT にだけトークン一式を保持する
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: AuthError;
  }
}
