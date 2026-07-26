import { Suspense } from "react";
import Image from "next/image";
import { auth, signIn, signOut } from "@/auth";
import FileBrowser from "@/components/FileBrowser";
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
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button type="submit" className={styles.buttonSecondary}>
            ログアウト
          </button>
        </form>
      </header>
      <Suspense fallback={null}>
        <FileBrowser />
      </Suspense>
    </div>
  );
}
