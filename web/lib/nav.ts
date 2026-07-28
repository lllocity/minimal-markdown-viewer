// 現在フォルダ（＋選択ファイル）を URL クエリに変換する。
// root かつファイル無しは素の "/"。FileBrowser と BookmarkMenu で共有する。
export function hrefFor(folderId: string, fileId?: string): string {
  const params = new URLSearchParams();
  if (folderId !== "root") params.set("folder", folderId);
  if (fileId) params.set("file", fileId);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
