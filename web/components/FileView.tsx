"use client";

import { useEffect, useRef, useState } from "react";
import MarkdownViewer from "./MarkdownViewer";
import Toc, { type TocHeading } from "./Toc";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<TocHeading[]>([]);

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

  // 本文が変わったら、描画済みの見出し（rehype-slug が id 付与）を DOM から読んで目次を作る。
  // 目次リンク＝本文の実 id なので、アンカーは構造上必ず一致する。
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = contentRef.current;
      if (!el) {
        setHeadings([]);
        return;
      }
      const hs = Array.from(
        el.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
      )
        .filter((h) => h.id)
        .map((h) => ({
          id: h.id,
          text: (h.textContent ?? "").trim(),
          level: Number(h.tagName[1]),
        }));
      setHeadings(hs);
    });
    return () => cancelAnimationFrame(raf);
  }, [content]);

  const showToc = !loading && !error && content !== "" && headings.length > 0;

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
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
          <div ref={contentRef}>
            <MarkdownViewer content={content} />
          </div>
        )}
      </div>

      {/* PC のみ: 右カラムに目次（モバイルでは CSS で非表示） */}
      {showToc && (
        <aside className={styles.tocCol}>
          <Toc headings={headings} />
        </aside>
      )}
    </div>
  );
}
