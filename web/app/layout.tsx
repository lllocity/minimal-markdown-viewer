import type { Metadata } from "next";
import "./globals.css";

// OGP の絶対 URL を生成するための基準 URL。
// 認証で使う AUTH_URL を再利用（ローカル: localhost、本番: Vercel ドメイン。W08 で設定）。
const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
const appName = "Minimal Markdown Viewer";
const appDescription =
  "Google Drive の Markdown ファイルを閲覧するシンプルなビューア";

// アイコン（icon.png / apple-icon.png / favicon.ico）と OGP 画像（opengraph-image.png）は
// app/ 配下のファイル規約により Next.js が自動で <head> タグを生成する。
// ここでは規約で補えないメタデータ（OGP のテキスト・Twitter カード種別など）を補完する。
export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: appName,
  description: appDescription,
  applicationName: appName,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: appName,
    title: appName,
    description: appDescription,
  },
  twitter: {
    // 大きな画像付きカード。twitter:image が無くても X 側が og:image をフォールバック利用する。
    card: "summary_large_image",
    title: appName,
    description: appDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
