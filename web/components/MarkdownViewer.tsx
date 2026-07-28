"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import styles from "./MarkdownViewer.module.css";

// 生 Markdown 文字列を GFM でレンダリングする。
// remark-breaks で単一改行（ソフト改行）も <br> に変換し、「書いた通りに改行」する
// （CommonMark 標準では単一改行はスペースになるため）。
export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // リンクは新規タブで開く（iOS 版の「リンクタップで Safari」に対応）
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
