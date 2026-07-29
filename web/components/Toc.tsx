"use client";

import { useEffect, useState } from "react";
import styles from "./Toc.module.css";

export interface TocHeading {
  id: string; // 本文見出しの id（rehype-slug 付与）＝アンカー先
  text: string;
  level: number; // 1..6
}

export default function Toc({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // 画面内にある見出しを検知して目次側をハイライトする
  useEffect(() => {
    if (headings.length === 0) return;
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // 画面内で一番上にある見出しを現在地とする
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActiveId(top.target.id);
      },
      { rootMargin: "-72px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav className={styles.toc} aria-label="目次">
      <p className={styles.title}>目次</p>
      <ul className={styles.list}>
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingInlineStart: `${(h.level - minLevel) * 0.9}rem` }}
          >
            <a
              href={`#${h.id}`}
              className={h.id === activeId ? styles.activeLink : styles.link}
              onClick={(e) => handleClick(e, h.id)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
