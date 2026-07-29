"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import styles from "./MarkdownViewer.module.css";

// 生 Markdown 文字列を GFM でレンダリングする。
// - remark-breaks: 単一改行（ソフト改行）も <br> に変換（CommonMark 標準はスペースになるため）。
// - rehype-slug: 各見出しに GitHub 風の id を付与（目次のアンカー先。id 生成はライブラリに委譲）。
export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSlug]}
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
