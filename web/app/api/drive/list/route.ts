import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google-token";
import { listFolder, getFolderPath, DriveApiError } from "@/lib/drive";

// 指定フォルダ（既定はマイドライブ）のサブフォルダ＋Markdown 一覧と、
// パンくず用の祖先パスを返す
export async function GET(request: NextRequest) {
  const auth = await getValidAccessToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const folderId = request.nextUrl.searchParams.get("folderId") || "root";

  try {
    const [entries, path] = await Promise.all([
      listFolder(auth.accessToken, folderId),
      getFolderPath(auth.accessToken, folderId),
    ]);
    return NextResponse.json({ entries, path });
  } catch (error) {
    const status = error instanceof DriveApiError ? error.status : 500;
    return NextResponse.json({ error: "drive_error" }, { status });
  }
}
