"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownViewer.module.css";

// 生 Markdown 文字列を GFM でレンダリングする（iOS 版の swift-markdown-ui と機能パリティ）
export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
