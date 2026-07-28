"use client";

import { createContext, useContext, useState } from "react";
import type { FolderCrumb } from "@/lib/drive";
import { ROOT_CRUMB } from "@/lib/drive";

// 現在表示中のフォルダ（ID＋表示名）をヘッダーのブックマークと共有するためのコンテキスト。
// FileBrowser が現在フォルダをセットし、ヘッダーの BookmarkMenu が「現フォルダを追加」に使う。
interface BrowseContextValue {
  currentFolder: FolderCrumb;
  setCurrentFolder: (folder: FolderCrumb) => void;
}

const BrowseContext = createContext<BrowseContextValue | null>(null);

export function BrowseProvider({ children }: { children: React.ReactNode }) {
  const [currentFolder, setCurrentFolder] = useState<FolderCrumb>(ROOT_CRUMB);
  return (
    <BrowseContext.Provider value={{ currentFolder, setCurrentFolder }}>
      {children}
    </BrowseContext.Provider>
  );
}

export function useBrowse(): BrowseContextValue {
  const ctx = useContext(BrowseContext);
  if (!ctx) {
    throw new Error("useBrowse は BrowseProvider の内側で使ってください");
  }
  return ctx;
}
