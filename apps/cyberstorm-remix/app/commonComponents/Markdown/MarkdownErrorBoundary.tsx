import * as Sentry from "@sentry/react-router";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface MarkdownErrorBoundaryProps {
  /**
   * The source being rendered. Doubles as the reset key: a new document must
   * get a fresh attempt, or one bad wiki page would leave every page visited
   * afterwards showing the fallback for the rest of the session.
   */
  input: string;
  children: ReactNode;
}

interface MarkdownErrorBoundaryState {
  hasError: boolean;
  seenInput: string;
}

/**
 * Renders markdown that fails to convert as plain text instead of taking the
 * page down with it.
 *
 * Markdown here is author-controlled — anyone can create a team, upload a
 * package and edit its wiki — and the conversion pipeline recurses over the
 * document tree, so sufficiently nested input overflows the stack. Measured
 * against this pipeline: ~500 nested HTML elements is enough to kill the tab in
 * Chrome, and ~5000 nested blockquotes overflows even without the raw-HTML
 * plugin. Both fit in a couple of KB, well inside the backend's 100KB limit on
 * markdown fields.
 *
 * Enumerating the constructs that can nest is a losing game — this catches the
 * failure instead, whatever produced it, so a crafted document costs its own
 * formatting rather than every viewer's tab. The text is still shown, because a
 * wiki page that renders as plain text is far more useful than an error.
 *
 * Scope: React render errors, which is where the conversion runs (MarkdownHooks
 * processes in an effect and rethrows on the following render).
 */
export class MarkdownErrorBoundary extends Component<
  MarkdownErrorBoundaryProps,
  MarkdownErrorBoundaryState
> {
  static displayName = "MarkdownErrorBoundary";

  state: MarkdownErrorBoundaryState = {
    hasError: false,
    seenInput: this.props.input,
  };

  static getDerivedStateFromError(): Partial<MarkdownErrorBoundaryState> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(
    props: MarkdownErrorBoundaryProps,
    state: MarkdownErrorBoundaryState
  ): Partial<MarkdownErrorBoundaryState> | null {
    if (props.input === state.seenInput) return null;
    // New document: clear the latch so it gets its own attempt.
    return { hasError: false, seenInput: props.input };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Match the other boundaries: log in dev, report in prod.
    if (!import.meta.env.PROD) {
      console.error("Markdown render error", error);
      return;
    }

    Sentry.captureException(error, {
      // One issue for all of these rather than one per document, so a single
      // crafted page can't flood the project.
      fingerprint: ["markdown-render"],
      contexts: {
        markdownErrorBoundary: {
          inputLength: this.props.input.length,
          componentStack: info.componentStack,
        },
      },
    });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return <pre className="markdown__fallback">{this.props.input}</pre>;
  }
}
