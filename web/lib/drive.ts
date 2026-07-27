// Google Drive REST API v3 のラッパと、フォルダ/.md 判定ロジック（テスト対象）

export const FOLDER_MIME = "application/vnd.google-apps.folder";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

export type DriveEntryType = "folder" | "markdown";

export interface DriveEntry {
  id: string;
  name: string;
  type: DriveEntryType;
  modifiedTime?: string;
}

// Drive API が返すファイル 1 件分（必要なフィールドのみ）
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export class DriveApiError extends Error {
  constructor(public status: number) {
    super(`Drive API error: ${status}`);
    this.name = "DriveApiError";
  }
}

// 本文が UTF-8 として読めなかったとき（iOS 版と同じく UTF-8 のみ対応）
export class DecodeError extends Error {
  constructor() {
    super("Content is not valid UTF-8");
    this.name = "DecodeError";
  }
}

// パンくず 1 要素（root からのフォルダ経路）
export interface FolderCrumb {
  id: string;
  name: string;
}

export const ROOT_CRUMB: FolderCrumb = { id: "root", name: "マイドライブ" };

/** フォルダかどうか */
export function isFolder(mimeType: string): boolean {
  return mimeType === FOLDER_MIME;
}

/**
 * Markdown ファイルかどうか。
 * Drive は .md の mimeType を text/markdown / text/plain / application/octet-stream など
 * まちまちに返すため、拡張子を主判定にしつつ mimeType も補助的に見る。
 */
export function isMarkdown(name: string, mimeType: string): boolean {
  const lower = name.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return true;
  return mimeType === "text/markdown" || mimeType === "text/x-markdown";
}

/** Drive ファイルを表示対象（フォルダ or Markdown）に変換。対象外は null */
export function toEntry(file: DriveFile): DriveEntry | null {
  if (isFolder(file.mimeType)) {
    return {
      id: file.id,
      name: file.name,
      type: "folder",
      modifiedTime: file.modifiedTime,
    };
  }
  if (isMarkdown(file.name, file.mimeType)) {
    return {
      id: file.id,
      name: file.name,
      type: "markdown",
      modifiedTime: file.modifiedTime,
    };
  }
  return null;
}

/** ファイル配列を表示用エントリ（フォルダ＋Markdown のみ）に絞り込む */
export function toEntries(files: DriveFile[]): DriveEntry[] {
  return files
    .map(toEntry)
    .filter((entry): entry is DriveEntry => entry !== null);
}

/**
 * 表示用に並べ替える。
 * - フォルダを先頭にまとめ、フォルダ同士は名前順（あいうえお/A→Z）。
 * - Markdown ファイルはその後ろに、更新の新しい順（降順）。
 * Drive API の orderBy はフォルダとファイルへ同じキーしか適用できず
 * 「フォルダは名前・ファイルは更新順」を分けられないため、ここで並べ替える。
 */
export function sortEntries(entries: DriveEntry[]): DriveEntry[] {
  const folders = entries.filter((e) => e.type === "folder");
  const files = entries.filter((e) => e.type !== "folder");

  folders.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  // modifiedTime は ISO 8601 文字列なので辞書順比較で新旧を判定できる。
  // 未設定（undefined）は空文字扱いで末尾に回す。降順なので b と a を反転して比較。
  files.sort((a, b) => (b.modifiedTime ?? "").localeCompare(a.modifiedTime ?? ""));

  return [...folders, ...files];
}

/**
 * 指定フォルダ直下のサブフォルダと Markdown 一覧を取得する。
 * folderId は "root"（マイドライブ）または実際のフォルダ ID。
 */
export async function listFolder(
  accessToken: string,
  folderId: string,
): Promise<DriveEntry[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType,modifiedTime)",
    // 並べ替えは取得後に sortEntries で行う（フォルダ=名前順・ファイル=更新降順）。
    // Drive 側の orderBy はグループ別キーを指定できないため、ここでは名前順で取っておく。
    orderBy: "folder,name",
    pageSize: "1000",
    spaces: "drive",
  });

  const res = await fetch(`${DRIVE_FILES_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new DriveApiError(res.status);

  const data = (await res.json()) as { files?: DriveFile[] };
  return sortEntries(toEntries(data.files ?? []));
}

// 1 ファイル/フォルダのメタ情報（親を辿るのに使う）
interface FileMeta {
  id: string;
  name: string;
  parents?: string[];
}

async function getFileMeta(
  accessToken: string,
  fileId: string,
): Promise<FileMeta> {
  const params = new URLSearchParams({ fields: "id,name,parents" });
  const res = await fetch(`${DRIVE_FILES_URL}/${fileId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new DriveApiError(res.status);
  return (await res.json()) as FileMeta;
}

/**
 * 指定フォルダの祖先パス（マイドライブ → … → 現在フォルダ）を返す。
 * URL 直リンクでもパンくずを再構築できるよう、親を順に辿って組み立てる。
 */
export async function getFolderPath(
  accessToken: string,
  folderId: string,
): Promise<FolderCrumb[]> {
  if (folderId === "root") return [ROOT_CRUMB];

  // マイドライブの実 ID（トップ到達の判定に使う）
  const rootId = (await getFileMeta(accessToken, "root")).id;

  const crumbs: FolderCrumb[] = [];
  const seen = new Set<string>(); // 循環防止
  let currentId: string | undefined = folderId;

  while (currentId && currentId !== rootId && !seen.has(currentId)) {
    seen.add(currentId);
    const meta = await getFileMeta(accessToken, currentId);
    crumbs.unshift({ id: meta.id, name: meta.name });
    currentId = meta.parents?.[0];
  }

  return [ROOT_CRUMB, ...crumbs];
}

// ファイル本文の取得結果
export interface DriveFileContent {
  name: string;
  content: string;
}

/** バイト列を UTF-8 として厳密にデコードする。壊れていれば DecodeError */
export function decodeUtf8(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new DecodeError();
  }
}

/**
 * 指定ファイルの名前と本文（生 Markdown）を取得する。
 * 本文は alt=media で生バイトを受け取り、UTF-8 として解釈する。
 */
export async function getFileContent(
  accessToken: string,
  fileId: string,
): Promise<DriveFileContent> {
  const [meta, res] = await Promise.all([
    getFileMeta(accessToken, fileId),
    fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  if (!res.ok) throw new DriveApiError(res.status);

  const content = decodeUtf8(await res.arrayBuffer());
  return { name: meta.name, content };
}
