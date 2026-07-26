import { describe, it, expect } from "vitest";
import {
  isFolder,
  isMarkdown,
  toEntry,
  toEntries,
  decodeUtf8,
  DecodeError,
  FOLDER_MIME,
  type DriveFile,
} from "./drive";

describe("isFolder", () => {
  it("フォルダの mimeType なら true", () => {
    expect(isFolder(FOLDER_MIME)).toBe(true);
  });

  it("フォルダ以外は false", () => {
    expect(isFolder("text/markdown")).toBe(false);
    expect(isFolder("text/plain")).toBe(false);
    expect(isFolder("")).toBe(false);
  });
});

describe("isMarkdown", () => {
  it(".md / .markdown 拡張子は true（mimeType 不問）", () => {
    expect(isMarkdown("note.md", "text/plain")).toBe(true);
    expect(isMarkdown("readme.markdown", "application/octet-stream")).toBe(true);
  });

  it("大文字拡張子でも true", () => {
    expect(isMarkdown("NOTE.MD", "application/octet-stream")).toBe(true);
    expect(isMarkdown("A.Markdown", "")).toBe(true);
  });

  it("拡張子が無くても markdown 系 mimeType なら true", () => {
    expect(isMarkdown("noext", "text/markdown")).toBe(true);
    expect(isMarkdown("noext", "text/x-markdown")).toBe(true);
  });

  it(".mdx や他拡張子は false（.md ビューアの対象外）", () => {
    expect(isMarkdown("doc.mdx", "text/plain")).toBe(false);
    expect(isMarkdown("photo.png", "image/png")).toBe(false);
    expect(isMarkdown("data.json", "application/json")).toBe(false);
  });

  it("名前に .md を含むが拡張子でない場合は false", () => {
    expect(isMarkdown("my.md.txt", "text/plain")).toBe(false);
  });
});

describe("toEntry", () => {
  it("フォルダは type=folder に変換", () => {
    const file: DriveFile = {
      id: "f1",
      name: "docs",
      mimeType: FOLDER_MIME,
      modifiedTime: "2026-01-01T00:00:00Z",
    };
    expect(toEntry(file)).toEqual({
      id: "f1",
      name: "docs",
      type: "folder",
      modifiedTime: "2026-01-01T00:00:00Z",
    });
  });

  it("Markdown は type=markdown に変換", () => {
    const file: DriveFile = {
      id: "m1",
      name: "note.md",
      mimeType: "text/plain",
    };
    expect(toEntry(file)).toEqual({
      id: "m1",
      name: "note.md",
      type: "markdown",
      modifiedTime: undefined,
    });
  });

  it("フォルダでも Markdown でもないものは null", () => {
    const file: DriveFile = {
      id: "p1",
      name: "photo.png",
      mimeType: "image/png",
    };
    expect(toEntry(file)).toBeNull();
  });
});

describe("toEntries", () => {
  it("フォルダと Markdown だけ残し、対象外は落とす", () => {
    const files: DriveFile[] = [
      { id: "f1", name: "docs", mimeType: FOLDER_MIME },
      { id: "m1", name: "a.md", mimeType: "text/markdown" },
      { id: "p1", name: "b.png", mimeType: "image/png" },
      { id: "j1", name: "c.json", mimeType: "application/json" },
      { id: "m2", name: "d.markdown", mimeType: "application/octet-stream" },
    ];
    const entries = toEntries(files);
    expect(entries.map((e) => e.id)).toEqual(["f1", "m1", "m2"]);
    expect(entries.map((e) => e.type)).toEqual([
      "folder",
      "markdown",
      "markdown",
    ]);
  });

  it("空配列は空配列", () => {
    expect(toEntries([])).toEqual([]);
  });
});

describe("decodeUtf8", () => {
  it("正しい UTF-8 バイト列を文字列に復元（日本語含む）", () => {
    const text = "# 見出し\nこんにちは 👋";
    const buffer = new TextEncoder().encode(text).buffer;
    expect(decodeUtf8(buffer)).toBe(text);
  });

  it("空バイト列は空文字列", () => {
    expect(decodeUtf8(new Uint8Array([]).buffer)).toBe("");
  });

  it("不正な UTF-8 バイト列は DecodeError を投げる", () => {
    const invalid = new Uint8Array([0xff, 0xfe, 0xff]).buffer;
    expect(() => decodeUtf8(invalid)).toThrow(DecodeError);
  });
});
