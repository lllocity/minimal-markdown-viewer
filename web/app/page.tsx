import { auth, signIn, signOut } from "@/auth";
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

  // ログイン済み（W04 で Drive 一覧に置き換える）
  return (
    <main className={styles.center}>
      <h1 className={styles.title}>Minimal Markdown Viewer</h1>
      <p className={styles.lead}>
        ログイン中: <strong>{session.user?.email}</strong>
      </p>
      <p className={styles.notice}>
        次のステップ（W04）で Google Drive のフォルダ一覧をここに表示します。
      </p>
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
    </main>
  );
}
