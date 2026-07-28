"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Bookmark } from "@/lib/bookmarks";
import {
  loadBookmarks,
  saveBookmarks,
  toggleBookmark,
  removeBookmark,
  isBookmarked,
} from "@/lib/bookmarks";
import { hrefFor } from "@/lib/nav";
import { useBrowse } from "./BrowseProvider";
import styles from "./BookmarkMenu.module.css";

export default function BookmarkMenu() {
  const router = useRouter();
  // 現在フォルダ（パンくず末尾）は BrowseProvider 経由で FileBrowser から共有される
  const { currentFolder: current } = useBrowse();
  // 初回描画時に localStorage から読み込む（遅延初期化・SSR 時は空）。
  // パネルは閉じた状態から始まり list に依存する DOM を出さないので、
  // サーバー([])とクライアント(実データ)で初期描画が食い違わない。
  const [list, setList] = useState<Bookmark[]>(loadBookmarks);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 外側クリック / Esc でパネルを閉じる
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function persist(next: Bookmark[]) {
    setList(next);
    saveBookmarks(next);
  }

  const currentBookmarked = isBookmarked(list, current.id);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="ブックマーク"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
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
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>ブックマーク</span>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() =>
                persist(
                  toggleBookmark(list, { id: current.id, name: current.name }),
                )
              }
            >
              {currentBookmarked ? "− このフォルダを解除" : "＋ このフォルダを追加"}
            </button>
          </div>

          {list.length === 0 ? (
            <p className={styles.empty}>まだブックマークがありません</p>
          ) : (
            <ul className={styles.list}>
              {list.map((bm) => (
                <li key={bm.id} className={styles.item}>
                  <button
                    type="button"
                    className={styles.itemName}
                    onClick={() => {
                      setOpen(false);
                      router.push(hrefFor(bm.id));
                    }}
                  >
                    <span className={styles.folderIcon}>📁</span>
                    <span className={styles.itemLabel}>{bm.name}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`${bm.name} を削除`}
                    onClick={() => persist(removeBookmark(list, bm.id))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
