"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Line = string | { text: string; className?: string };

type SplitTextProps = {
  /** Lines are hard breaks; words inside a line wrap naturally. */
  lines: Line | Line[];
  mode?: "chars" | "words";
  trigger?: "load" | "scroll";
  duration?: number;
  stagger?: number;
  delay?: number;
  className?: string;
};

type Token = {
  value: string;
  index: number;
};

function readableLine(line: Line) {
  return typeof line === "string" ? line : line.text;
}

function wordsOf(line: Line) {
  return readableLine(line).trim().split(/\s+/).filter(Boolean);
}

function delayFor(index: number, stagger: number, delay: number) {
  return `${delay + index * stagger}ms`;
}

/**
 * Masked display-type reveal. The text is split before paint so the heading
 * never flashes; a visually hidden copy keeps the heading readable to screen
 * readers. No-JS leaves the type fully visible.
 */
export function SplitText({
  lines,
  mode = "words",
  trigger = "scroll",
  duration = 880,
  stagger = 52,
  delay = 0,
  className = "",
}: SplitTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(trigger === "load");

  useEffect(() => {
    if (trigger === "load") return;
    const node = rootRef.current;
    if (!node) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -16% 0px", threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [trigger]);

  const allLines = Array.isArray(lines) ? lines : [lines];
  const label = allLines.map(readableLine).join(" ");
  let tokenIndex = 0;

  const tokens: ReactNode[] = allLines.map((line, lineIndex) => {
    const words = wordsOf(line);
    return (
      <span
        key={`${readableLine(line)}-${lineIndex}`}
        className={`tr-line ${typeof line === "string" ? "" : (line.className ?? "")}`}
      >
        {words.map((word, wordIndex) => {
          const lineTokens: Token[] =
            mode === "chars"
              ? Array.from(word).map((character) => ({
                  value: character,
                  index: tokenIndex++,
                }))
              : [{ value: word, index: tokenIndex++ }];

          return (
            <span key={`${word}-${wordIndex}`} className="tr-word-wrap">
              {mode === "chars" ? (
                <span className="tr-word">
                  {lineTokens.map((token, characterIndex) => (
                    <span
                      key={`${token.value}-${characterIndex}`}
                      className="tr-mask"
                    >
                      <span
                        className="tr-token"
                        style={{ "--tr-delay": delayFor(token.index, stagger, delay) } as CSSProperties}
                      >
                        {token.value}
                      </span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="tr-mask">
                  <span
                    className="tr-token"
                    style={{ "--tr-delay": delayFor(lineTokens[0].index, stagger, delay) } as CSSProperties}
                  >
                    {word}
                  </span>
                </span>
              )}
              {wordIndex < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </span>
    );
  });

  return (
    <span
      ref={rootRef}
      className={`type-reveal ${
        trigger === "load" ? "type-reveal--load" : ""
      } ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--tr-duration": `${duration}ms` } as CSSProperties}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="type-reveal-inner">
        {tokens}
      </span>
    </span>
  );
}
