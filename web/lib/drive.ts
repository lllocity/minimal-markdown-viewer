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
    orderBy: "folder,name",
    pageSize: "1000",
    spaces: "drive",
  });

  const res = await fetch(`${DRIVE_FILES_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new DriveApiError(res.status);

  const data = (await res.json()) as { files?: DriveFile[] };
  return toEntries(data.files ?? []);
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
