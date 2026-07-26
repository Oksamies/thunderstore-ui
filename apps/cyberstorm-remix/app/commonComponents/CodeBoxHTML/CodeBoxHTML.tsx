import { stripHtmlTags } from "cyberstorm/utils/HTMLParsing";
import {
  type CSSProperties,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { NewAlert } from "@thunderstore/cyberstorm";

export interface CodeBoxHTMLProps {
  /** Pygments-highlighted HTML as returned by the source API. */
  value?: string;
  maxHeight?: number;
}

// Row height in px. Mirrored into CSS as a custom property on the surface, so
// the number the windowing maths uses and the height the browser lays out
// cannot drift apart.
const LINE_HEIGHT = 20;

// Rows rendered above and below the visible range, so a fast scroll doesn't
// expose a blank band before the next window is committed.
const OVERSCAN = 20;

// Used until the container has been measured — and during SSR, where there is
// no viewport to measure. Enough to fill a tall screen.
const INITIAL_VISIBLE_ROWS = 60;

// Beyond this many lines the surface would approach the browser's maximum
// element height (~33.5M px in Chrome, i.e. ~1.7M rows at this row height), past
// which the scroll offset no longer maps to a row and the tail becomes
// unreachable. The API truncates long results well before this, so it is a
// backstop against a silent failure rather than an expected path.
const MAX_LINES = 200_000;

// Every token class Highlight.css styles — i.e. the complete set Pygments can
// emit for us. Sorted longest-first so the alternation below matches the whole
// class rather than a prefix of it.
const PYGMENTS_TOKEN_CLASSES = [
  "bp",
  "c",
  "c1",
  "ch",
  "cm",
  "cp",
  "cpf",
  "cs",
  "dl",
  "err",
  "esc",
  "fm",
  "g",
  "gd",
  "ge",
  "ges",
  "gh",
  "gi",
  "go",
  "gp",
  "gr",
  "gs",
  "gt",
  "gu",
  "il",
  "k",
  "kc",
  "kd",
  "kn",
  "kp",
  "kr",
  "kt",
  "l",
  "ld",
  "m",
  "mb",
  "mf",
  "mh",
  "mi",
  "mo",
  "n",
  "na",
  "nb",
  "nc",
  "nd",
  "ne",
  "nf",
  "ni",
  "nl",
  "nn",
  "no",
  "nt",
  "nv",
  "nx",
  "o",
  "ow",
  "p",
  "pm",
  "py",
  "s",
  "s1",
  "s2",
  "sa",
  "sb",
  "sc",
  "sd",
  "se",
  "sh",
  "si",
  "sr",
  "ss",
  "sx",
  "vc",
  "vg",
  "vi",
  "vm",
  "w",
  "x",
]
  .sort((a, b) => b.length - a.length)
  .join("|");

/**
 * Matches any tag that is not `</span>` or a `<span>` carrying exactly one
 * known Pygments token class — together the complete grammar of the highlighted
 * HTML the source API returns. Everything between those tags is HTML-escaped by
 * Pygments.
 *
 * The class is pinned to the known token set rather than "any word": a class
 * this component does not style has no reason to reach the DOM, and allowing
 * arbitrary ones would let package contents borrow the site's own class names.
 * If the backend ever emits a token outside this list the file falls back to
 * plain text with a visible notice, which is a safe and noticeable failure.
 */
const NON_PYGMENTS_TAG = new RegExp(
  `<(?!\\/span>)(?!span class="(?:${PYGMENTS_TOKEN_CLASSES})">)[^>]*>`
);

/**
 * True when `html` contains nothing but the span markup described above.
 *
 * The decompiled code rendered here derives from package contents, and anyone
 * can upload a package — so we do not simply trust the API to have escaped it.
 * Running a full sanitiser over several MB on every render would cost more than
 * the rendering does, so instead we check the markup matches the one shape the
 * backend is supposed to emit and fall back to plain text when it doesn't.
 * Unexpected markup therefore costs syntax colour, never script execution.
 */
export function isPygmentsMarkup(html: string): boolean {
  return !NON_PYGMENTS_TAG.test(html);
}

/**
 * Number of characters a line occupies on screen, i.e. ignoring the markup.
 * Counts an entity like `&lt;` as its source length rather than one glyph,
 * which only ever overestimates the width — a slightly long scroll range is
 * harmless, a short one would clip code.
 */
function visibleLength(line: string): number {
  let length = 0;
  let inTag = false;
  for (let i = 0; i < line.length; i++) {
    const code = line.charCodeAt(i);
    if (code === 60 /* < */) inTag = true;
    else if (code === 62 /* > */) inTag = false;
    else if (!inTag) length++;
  }
  return length;
}

/**
 * Viewer for the server-highlighted source on a package's Source tab.
 *
 * Two things make this cheap enough to open a decompiled assembly:
 *
 * 1. It renders the highlighting the API already did. The previous version
 *    stripped every span back out with a regex and then re-highlighted the
 *    result client-side with highlight.js, which measured ~700ms of blocking
 *    work per file — and a package like BepInExPack ships twelve of them. The
 *    `.highlight` stylesheet for these classes was already in the bundle, just
 *    unused.
 *
 * 2. It only builds DOM for the rows you can see. Those same twelve files are
 *    ~230k spans in total; mounting that kept the tab pinned at 100% CPU long
 *    after the initial render, because every later layout and paint had to walk
 *    it. Windowing holds it to a few hundred nodes whatever the file size.
 */
export const CodeBoxHTML = memo(function CodeBoxHTML({
  value = "",
  maxHeight = 600,
}: CodeBoxHTMLProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    INITIAL_VISIBLE_ROWS * LINE_HEIGHT
  );

  const { lines, widestLine, trusted, droppedLines } = useMemo(() => {
    if (!value) {
      return {
        lines: [] as string[],
        widestLine: 0,
        trusted: true,
        droppedLines: 0,
      };
    }
    const isTrusted = isPygmentsMarkup(value);
    // Splitting on newlines can leave a row's markup unbalanced if a span ever
    // spans one — Pygments does not do that for the output we see, and if it
    // did the only cost is colour: each row's HTML is parsed into its own
    // <code>, so an unclosed tag is auto-closed there and cannot escape it.
    const all = (isTrusted ? value : stripHtmlTags(value)).split("\n");
    const split = all.length > MAX_LINES ? all.slice(0, MAX_LINES) : all;
    let widest = 0;
    for (const line of split) {
      const length = isTrusted ? visibleLength(line) : line.length;
      if (length > widest) widest = length;
    }
    return {
      lines: split,
      widestLine: widest,
      trusted: isTrusted,
      droppedLines: all.length - split.length,
    };
  }, [value]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    setViewportHeight(element.clientHeight);
    const observer = new ResizeObserver(() => {
      setViewportHeight(element.clientHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const firstRow = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN);
  const lastRow = Math.min(
    lines.length,
    Math.ceil((scrollTop + viewportHeight) / LINE_HEIGHT) + OVERSCAN
  );

  if (!value) {
    return <NewAlert csVariant="info">No source available.</NewAlert>;
  }

  const surfaceStyle = {
    height: lines.length * LINE_HEIGHT,
    // `ch` is exact for a monospace face, so the horizontal scroll range stays
    // put instead of resizing as rows scroll in and out of the window.
    minWidth: `${widestLine}ch`,
    "--code-view-line-height": `${LINE_HEIGHT}px`,
  } as CSSProperties;

  return (
    <div className="code-view">
      {!trusted && (
        <NewAlert csVariant="warning">
          This file contained unexpected markup, so it is shown without syntax
          highlighting.
        </NewAlert>
      )}
      {droppedLines > 0 && (
        <NewAlert csVariant="warning">
          Showing the first {MAX_LINES.toLocaleString()} lines;{" "}
          {droppedLines.toLocaleString()} more are not displayed. Download the
          file to read it in full.
        </NewAlert>
      )}
      <div
        ref={scrollRef}
        className="code-view__scroll highlight"
        style={{ maxHeight }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div className="code-view__surface" style={surfaceStyle}>
          {lines.slice(firstRow, lastRow).map((line, index) => {
            const row = firstRow + index;
            return (
              <div
                key={row}
                className="code-view__row"
                style={{ top: row * LINE_HEIGHT }}
              >
                <span className="code-view__gutter" aria-hidden="true">
                  {row + 1}
                </span>
                {trusted ? (
                  <code
                    className="code-view__code"
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ) : (
                  <code className="code-view__code">{line}</code>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CodeBoxHTML.displayName = "CodeBoxHTML";
