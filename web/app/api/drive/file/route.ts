import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google-token";
import { getFileContent, DriveApiError, DecodeError } from "@/lib/drive";

// 指定ファイル（?id=）の名前と本文（生 Markdown）を返す
export async function GET(request: NextRequest) {
  const auth = await getValidAccessToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    const file = await getFileContent(auth.accessToken, id);
    return NextResponse.json(file);
  } catch (error) {
    if (error instanceof DecodeError) {
      return NextResponse.json({ error: "decode" }, { status: 415 });
    }
    const status = error instanceof DriveApiError ? error.status : 500;
    return NextResponse.json({ error: "drive_error" }, { status });
  }
}
