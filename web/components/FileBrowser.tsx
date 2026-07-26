"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DriveEntry, FolderCrumb } from "@/lib/drive";
import { ROOT_CRUMB } from "@/lib/drive";
import FileView from "./FileView";
import styles from "./FileBrowser.module.css";

// 現在フォルダ（＋選択ファイル）を URL クエリへ。root かつファイル無しは素の "/"
function hrefFor(folderId: string, fileId?: string): string {
  const params = new URLSearchParams();
  if (folderId !== "root") params.set("folder", folderId);
  if (fileId) params.set("file", fileId);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default function FileBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder") || "root";
  const fileId = searchParams.get("file");

  const [entries, setEntries] = useState<DriveEntry[]>([]);
  const [path, setPath] = useState<FolderCrumb[]>([ROOT_CRUMB]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL（folderId）が真実。変わるたびに中身とパンくずを取得する
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/drive/list?folderId=${encodeURIComponent(folderId)}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setError(
            res.status === 401
              ? "セッションの有効期限が切れました。再読み込みしてください。"
              : "フォルダを読み込めませんでした。",
          );
          setEntries([]);
        } else {
          const data = (await res.json()) as {
            entries: DriveEntry[];
            path: FolderCrumb[];
          };
          if (cancelled) return;
          setEntries(data.entries);
          setPath(data.path);
        }
      } catch {
        if (!cancelled) {
          setError("通信に失敗しました。");
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  // フォルダを移動（読み込み表示はここで立てる）
  function goToFolder(targetId: string) {
    if (targetId === folderId && !fileId) return;
    setLoading(true);
    setError(null);
    router.push(hrefFor(targetId));
  }

  // ファイルを開く（現在フォルダは保ったまま ?file= を付ける）
  function openFile(id: string) {
    router.push(hrefFor(folderId, id));
  }

  // ファイル表示中は一覧の代わりにビューアを出す
  if (fileId) {
    return (
      <FileView fileId={fileId} onBack={() => router.push(hrefFor(folderId))} />
    );
  }

  return (
    <div className={styles.browser}>
      {/* パンくずリスト */}
      <nav className={styles.breadcrumb} aria-label="フォルダ階層">
        {path.map((crumb, i) => (
          <span key={crumb.id} className={styles.crumbItem}>
            {i > 0 && <span className={styles.sep}>/</span>}
            {i < path.length - 1 ? (
              <button
                className={styles.crumbLink}
                onClick={() => goToFolder(crumb.id)}
              >
                {crumb.name}
              </button>
            ) : (
              <span className={styles.crumbCurrent}>{crumb.name}</span>
            )}
          </span>
        ))}
      </nav>

      {loading && <p className={styles.status}>読み込み中…</p>}
      {!loading && error && <p className={styles.error}>{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className={styles.status}>
          このフォルダにはフォルダ・Markdown がありません。
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((entry) =>
            entry.type === "folder" ? (
              <li key={entry.id}>
                <button
                  className={styles.row}
                  onClick={() => goToFolder(entry.id)}
                >
                  <span className={styles.icon}>📁</span>
                  <span className={styles.name}>{entry.name}</span>
                </button>
              </li>
            ) : (
              <li key={entry.id}>
                <button className={styles.row} onClick={() => openFile(entry.id)}>
                  <span className={styles.icon}>📄</span>
                  <span className={styles.name}>{entry.name}</span>
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
