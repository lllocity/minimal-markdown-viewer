import { Suspense } from "react";
import Image from "next/image";
import { auth, signIn, signOut } from "@/auth";
import FileBrowser from "@/components/FileBrowser";
import BookmarkMenu from "@/components/BookmarkMenu";
import { BrowseProvider } from "@/components/BrowseProvider";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth();

  // 未ログイン、またはリフレッシュ失敗で再ログインが必要
  if (!session || session.error) {
    return (
      <main className={styles.center}>
        <h1 className={styles.title}>Minimal Markdown Viewer</h1>
        <p className={styles.lead}>
          Google Drive の Markdown ファイルを閲覧するには、
          <br />
          Google アカウントでログインしてください。
        </p>
        {session?.error ? (
          <p className={styles.notice}>
            セッションの有効期限が切れました。再度ログインしてください。
          </p>
        ) : null}
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button type="submit" className={styles.button}>
            Google でログイン
          </button>
        </form>
      </main>
    );
  }

  // ログイン済み: Drive のフォルダ／Markdown をブラウズ
  return (
    <BrowseProvider>
      <div className={styles.app}>
        <header className={styles.header}>
          <Image
            src="/logo.png"
            alt=""
            width={24}
            height={24}
            className={styles.logo}
            priority
          />
          <span className={styles.appName}>Minimal Markdown Viewer</span>
          <span className={styles.spacer} />
          <span className={styles.userEmail}>{session.user?.email}</span>
          <BookmarkMenu />
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className={styles.buttonSecondary}
              aria-label="ログアウト"
            >
              <svg
                className={styles.logoutIcon}
                viewBox="0 0 24 24"
                width={18}
                height={18}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className={styles.buttonLabel}>ログアウト</span>
            </button>
          </form>
        </header>
        <Suspense fallback={null}>
          <FileBrowser />
        </Suspense>
      </div>
    </BrowseProvider>
  );
}
