import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";

import { CodeBoxHTML, isPygmentsMarkup } from "../CodeBoxHTML";
// The windowing is driven by the scroll port's real geometry, so the component's
// own stylesheet has to be applied for the scrolling test to mean anything.
import "../CodeBoxHTML.css";

(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = undefined;
  root = undefined;
  delete (window as unknown as Record<string, unknown>).__xss;
});

async function render(value: string, maxHeight = 600) {
  container = document.createElement("div");
  container.style.cssText = "width:900px";
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(createElement(CodeBoxHTML, { value, maxHeight }));
  });
  return container;
}

/** A line of Pygments output, the shape the source API returns. */
const line = (n: number) =>
  `<span class="k">var</span><span class="w"> </span><span class="n">x${n}</span><span class="p">;</span>`;

const pygmentsFile = (lineCount: number) =>
  Array.from({ length: lineCount }, (_, i) => line(i)).join("\n");

describe("isPygmentsMarkup", () => {
  test("accepts the span markup the backend emits", () => {
    expect(isPygmentsMarkup(pygmentsFile(3))).toBe(true);
    expect(isPygmentsMarkup('<span class="nf">Foo</span>')).toBe(true);
    expect(isPygmentsMarkup("plain text with no markup at all")).toBe(true);
    // Escaped angle brackets are text, not tags.
    expect(isPygmentsMarkup('<span class="o">&lt;&gt;</span>')).toBe(true);
  });

  test("rejects anything else", () => {
    const rejected = [
      "<script>window.__xss = 1</script>",
      '<img src=x onerror="window.__xss = 1">',
      '<iframe src="https://evil.example"></iframe>',
      '<span class="k" onclick="window.__xss = 1">x</span>',
      '<span class="k" style="background:url(x)">x</span>',
      '<span class="k"><a href="javascript:window.__xss = 1">x</a></span>',
      "<SPAN CLASS=k>x</SPAN>",
      '<span class="k&quot; onload=&quot;alert(1)">x</span>',
      // Malformed variants of an otherwise valid span.
      '<span  class="k">x</span>',
      '<span class="k" >x</span>',
      '<span\nclass="k">x</span>',
      '<span class="k">x</span >',
      "<span class='k'>x</span>",
      "<span class=k>x</span>",
      '<spanx class="k">x</span>',
      '<span class="k"/>',
    ];
    for (const markup of rejected) {
      expect(isPygmentsMarkup(markup), markup).toBe(false);
    }
  });

  test("rejects classes outside the Pygments token set", () => {
    // A class this component does not style has no business reaching the DOM;
    // allowing arbitrary ones would let package contents borrow the site's own
    // class names and restyle text inside the viewer.
    const rejected = [
      '<span class="navigation-header">x</span>',
      '<span class="">x</span>',
      '<span class="k n">x</span>',
      '<span class="kk">x</span>',
      '<span class="K">x</span>',
    ];
    for (const markup of rejected) {
      expect(isPygmentsMarkup(markup), markup).toBe(false);
    }
    // …while every class the stylesheet actually defines still passes.
    for (const token of [
      "k",
      "kt",
      "nn",
      "nf",
      "c1",
      "err",
      "w",
      "sc",
      "ges",
    ]) {
      expect(isPygmentsMarkup(`<span class="${token}">x</span>`), token).toBe(
        true
      );
    }
  });
});

describe("CodeBoxHTML rendering", () => {
  test("keeps the server's highlighting instead of re-deriving it", async () => {
    const el = await render(pygmentsFile(3));

    expect(el.querySelectorAll(".code-view__row")).toHaveLength(3);
    expect(el.querySelector(".code-view__code")?.innerHTML).toBe(line(0));
    // The `.highlight` scope is what the Pygments stylesheet keys off.
    expect(el.querySelector(".code-view__scroll")?.classList).toContain(
      "highlight"
    );
  });

  test("numbers the lines from one", async () => {
    const el = await render(pygmentsFile(5));
    const gutters = [...el.querySelectorAll(".code-view__gutter")].map(
      (g) => g.textContent
    );

    expect(gutters).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("only mounts a window of rows for a large file", async () => {
    // The regression this guards: a decompiled assembly mounted every line at
    // once, and the resulting DOM kept the tab at 100% CPU.
    const el = await render(pygmentsFile(20_000));

    const rows = el.querySelectorAll(".code-view__row").length;
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(200);
    expect(el.querySelectorAll("*").length).toBeLessThan(2_000);
  });

  test("sizes the scroll surface for every line, not just the mounted ones", async () => {
    const el = await render(pygmentsFile(1_000));
    const surface = el.querySelector(".code-view__surface") as HTMLElement;

    // 1000 lines at the 20px row height.
    expect(surface.style.height).toBe("20000px");
  });

  test("renders later lines after scrolling", async () => {
    const el = await render(pygmentsFile(5_000));
    const scroller = el.querySelector(".code-view__scroll") as HTMLElement;

    await act(async () => {
      scroller.scrollTop = 10_000;
      scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    const gutters = [...el.querySelectorAll(".code-view__gutter")].map((g) =>
      Number(g.textContent)
    );
    // 10000px / 20px = line 500, minus the overscan.
    expect(Math.min(...gutters)).toBeGreaterThan(400);
    expect(Math.min(...gutters)).toBeLessThanOrEqual(500);
    expect(Math.max(...gutters)).toBeGreaterThan(500);
  });

  test("shows an empty state for a missing file", async () => {
    const el = await render("");

    expect(el.querySelector(".code-view__row")).toBeNull();
    expect(el.textContent).toContain("No source available");
  });

  test("caps absurd line counts instead of building an unreachable surface", async () => {
    // Past ~1.7M rows the surface exceeds the browser's maximum element height
    // and the tail silently stops being scrollable. Truncate visibly instead.
    const el = await render("\n".repeat(250_000));
    const surface = el.querySelector(".code-view__surface") as HTMLElement;

    // Compared numerically: the browser serialises large px values in
    // exponential form ("4e+06px").
    expect(parseFloat(surface.style.height)).toBe(200_000 * 20);
    expect(el.textContent).toContain("Showing the first");
    expect(el.textContent).toContain("Download the file");
  });

  test("says nothing about truncation for an ordinary file", async () => {
    const el = await render(pygmentsFile(100));

    expect(el.textContent).not.toContain("Showing the first");
  });
});

describe("CodeBoxHTML refuses to trust unexpected markup", () => {
  const attacks = [
    "<script>window.__xss = 1</script>",
    '<img src=x onerror="window.__xss = 1">',
    '<iframe src="https://evil.example"></iframe>',
    '<span class="k" onmouseover="window.__xss = 1">hover</span>',
    '<span class="k">ok</span>\n<script>window.__xss = 1</script>',
  ];

  test.each(attacks)("falls back to plain text for %s", async (markup) => {
    const el = await render(markup);

    expect(el.querySelector("script")).toBeNull();
    expect(el.querySelector("img")).toBeNull();
    expect(el.querySelector("iframe")).toBeNull();
    expect(el.innerHTML).not.toMatch(/\son[a-z]+=/i);
    expect(
      (window as unknown as Record<string, unknown>).__xss
    ).toBeUndefined();
    // The user still sees the file, just uncoloured, plus a note saying so.
    expect(el.textContent).toContain("without syntax highlighting");
  });

  test("still shows the code when it falls back", async () => {
    const el = await render('<span class="k">keep</span><script>bad</script>');

    expect(el.textContent).toContain("keep");
    expect(
      el.querySelector(".code-view__code")?.querySelector("span")
    ).toBeNull();
  });
});
