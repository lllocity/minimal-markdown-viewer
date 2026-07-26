"use client";

import { useEffect, useState } from "react";
import MarkdownViewer from "./MarkdownViewer";
import styles from "./FileView.module.css";

export default function FileView({
  fileId,
  onBack,
}: {
  fileId: string;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/drive/file?id=${encodeURIComponent(fileId)}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setError(
            res.status === 401
              ? "セッションの有効期限が切れました。再読み込みしてください。"
              : res.status === 415
                ? "文字コードを読み取れませんでした（UTF-8 のみ対応）。"
                : "ファイルを開けませんでした。",
          );
        } else {
          const data = (await res.json()) as { name: string; content: string };
          if (cancelled) return;
          setName(data.name);
          setContent(data.content);
        }
      } catch {
        if (!cancelled) setError("通信に失敗しました。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return (
    <div className={styles.view}>
      <div className={styles.bar}>
        <button className={styles.back} onClick={onBack}>
          ← 一覧に戻る
        </button>
        {name && <span className={styles.fileName}>{name}</span>}
      </div>

      {loading && <p className={styles.status}>読み込み中…</p>}
      {!loading && error && <p className={styles.error}>{error}</p>}
      {!loading && !error && content === "" && (
        <p className={styles.status}>ファイルが空です。</p>
      )}
      {!loading && !error && content !== "" && (
        <MarkdownViewer content={content} />
      )}
    </div>
  );
}
