import { describe, it, expect } from "vitest";
import {
  isBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  parseBookmarks,
  serializeBookmarks,
  type Bookmark,
} from "./bookmarks";

const a: Bookmark = { id: "f1", name: "議事録" };
const b: Bookmark = { id: "f2", name: "レポート" };

describe("isBookmarked", () => {
  it("登録済みは true、未登録は false", () => {
    expect(isBookmarked([a, b], "f1")).toBe(true);
    expect(isBookmarked([a, b], "zzz")).toBe(false);
    expect(isBookmarked([], "f1")).toBe(false);
  });
});

describe("addBookmark", () => {
  it("未登録なら末尾に追加（元配列は破壊しない）", () => {
    const list = [a];
    const next = addBookmark(list, b);
    expect(next.map((x) => x.id)).toEqual(["f1", "f2"]);
    expect(list).toEqual([a]); // 元は不変
  });

  it("同 id は重複させず、表示名だけ更新する", () => {
    const next = addBookmark([a], { id: "f1", name: "議事録（改名）" });
    expect(next).toHaveLength(1);
    expect(next[0]).toEqual({ id: "f1", name: "議事録（改名）" });
  });
});

describe("removeBookmark", () => {
  it("指定 id を削除、無ければそのまま", () => {
    expect(removeBookmark([a, b], "f1").map((x) => x.id)).toEqual(["f2"]);
    expect(removeBookmark([a, b], "zzz")).toEqual([a, b]);
  });
});

describe("toggleBookmark", () => {
  it("未登録なら追加、登録済みなら削除", () => {
    const added = toggleBookmark([a], b);
    expect(added.map((x) => x.id)).toEqual(["f1", "f2"]);
    const removed = toggleBookmark(added, b);
    expect(removed.map((x) => x.id)).toEqual(["f1"]);
  });
});

describe("parseBookmarks", () => {
  it("null・空文字は空配列", () => {
    expect(parseBookmarks(null)).toEqual([]);
    expect(parseBookmarks("")).toEqual([]);
  });

  it("不正 JSON・配列以外は空配列", () => {
    expect(parseBookmarks("{oops")).toEqual([]);
    expect(parseBookmarks('{"id":"f1"}')).toEqual([]);
  });

  it("壊れた要素（id/name 欠落や空 id）は除外する", () => {
    const raw = JSON.stringify([
      a,
      { id: "f2" }, // name 欠落
      { name: "no id" }, // id 欠落
      { id: "", name: "空 id" }, // 空 id
      b,
    ]);
    expect(parseBookmarks(raw)).toEqual([a, b]);
  });

  it("serialize→parse で往復できる", () => {
    expect(parseBookmarks(serializeBookmarks([a, b]))).toEqual([a, b]);
  });
});
