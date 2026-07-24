import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";

import { Markdown } from "../Markdown";

(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = undefined;
  root = undefined;
});

async function render(input: string, budgetMs = 20_000) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(createElement(Markdown, { input }));
  });
  const deadline = performance.now() + budgetMs;
  while (
    container.textContent === "Loading markdown..." &&
    performance.now() < deadline
  ) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });
  }
  return container;
}

const nestedHtml = (depth: number) =>
  "<div>".repeat(depth) + "deeply nested text" + "</div>".repeat(depth);

const nestedQuote = (depth: number) => ">".repeat(depth) + " quoted text";

describe("Markdown survives documents that overflow the converter", () => {
  // Both of these fit in a couple of KB, far inside the backend's 100KB cap on
  // markdown fields, and both killed the tab before the boundary existed.
  test.each([
    ["nested HTML, depth 2000", nestedHtml(2_000), "deeply nested text"],
    ["nested HTML, depth 20000", nestedHtml(20_000), "deeply nested text"],
    ["nested blockquotes, depth 20000", nestedQuote(20_000), "quoted text"],
  ])("renders %s as text instead of crashing", async (_name, input, needle) => {
    const el = await render(input);

    // The tab is alive, the page still has a markdown region, and the author's
    // content is still legible.
    expect(el.querySelector(".markdown")).not.toBeNull();
    expect(el.textContent).toContain(needle);
    expect(el.textContent).not.toBe("Loading markdown...");
  });

  test("ordinary documents are unaffected by the boundary", async () => {
    const el = await render(
      "# Title\n\n<details><summary>s</summary>\n\nbody\n\n</details>"
    );

    expect(el.querySelector("h1")?.textContent).toBe("Title");
    expect(el.querySelector("details")).not.toBeNull();
    expect(el.querySelector(".markdown__fallback")).toBeNull();
  });

  test("a bad document does not poison the next one", async () => {
    // The boundary latches on error; without a reset keyed to the input, every
    // wiki page visited after a crafted one would render as plain text too.
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(createElement(Markdown, { input: nestedHtml(20_000) }));
    });
    let deadline = performance.now() + 20_000;
    while (
      container.textContent === "Loading markdown..." &&
      performance.now() < deadline
    ) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 25));
      });
    }
    expect(container.querySelector(".markdown__fallback")).not.toBeNull();

    await act(async () => {
      root?.render(createElement(Markdown, { input: "# Recovered" }));
    });
    deadline = performance.now() + 20_000;
    while (
      container.querySelector("h1") === null &&
      performance.now() < deadline
    ) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 25));
      });
    }

    expect(container.querySelector("h1")?.textContent).toBe("Recovered");
    expect(container.querySelector(".markdown__fallback")).toBeNull();
  });
});
