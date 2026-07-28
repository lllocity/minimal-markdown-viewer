// フォルダのブックマーク。バックエンドを持たないため localStorage に保存する。
// 判定・追加・削除・パースは純粋関数に切り出し（テスト対象）、
// localStorage の読み書きだけを薄いラッパにしている。

export interface Bookmark {
  id: string; // Drive フォルダ ID（パーマリンク ?folder=<id> で復元できる）
  name: string; // 表示名
}

const STORAGE_KEY = "mmv.bookmarks.v1";

/** そのフォルダが登録済みか */
export function isBookmarked(list: Bookmark[], id: string): boolean {
  return list.some((b) => b.id === id);
}

/**
 * 追加する。同 id が既にあれば重複させず、表示名だけ最新に更新する。
 * 元配列は破壊せず新しい配列を返す。
 */
export function addBookmark(list: Bookmark[], bookmark: Bookmark): Bookmark[] {
  if (isBookmarked(list, bookmark.id)) {
    return list.map((b) =>
      b.id === bookmark.id ? { ...b, name: bookmark.name } : b,
    );
  }
  return [...list, bookmark];
}

/** 削除する（無ければそのまま） */
export function removeBookmark(list: Bookmark[], id: string): Bookmark[] {
  return list.filter((b) => b.id !== id);
}

/** 登録済みなら外し、未登録なら足す */
export function toggleBookmark(list: Bookmark[], bookmark: Bookmark): Bookmark[] {
  return isBookmarked(list, bookmark.id)
    ? removeBookmark(list, bookmark.id)
    : addBookmark(list, bookmark);
}

/**
 * localStorage の生文字列を Bookmark[] に復元する。
 * null・不正 JSON・配列以外は空配列に。壊れた要素（id/name 欠落）は除外する。
 */
export function parseBookmarks(raw: string | null): Bookmark[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (b): b is Bookmark =>
        b != null &&
        typeof (b as Bookmark).id === "string" &&
        typeof (b as Bookmark).name === "string" &&
        (b as Bookmark).id.length > 0,
    );
  } catch {
    return [];
  }
}

/** Bookmark[] を保存用文字列にする */
export function serializeBookmarks(list: Bookmark[]): string {
  return JSON.stringify(list);
}

// --- localStorage ラッパ（SSR ガード込み・副作用あり）---

/** localStorage から読み込む（サーバー実行時は空） */
export function loadBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  return parseBookmarks(window.localStorage.getItem(STORAGE_KEY));
}

/** localStorage に保存する（サーバー実行時は何もしない） */
export function saveBookmarks(list: Bookmark[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, serializeBookmarks(list));
}
