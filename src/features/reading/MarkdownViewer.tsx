import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Markdown, { type Components } from "react-markdown";
import rehypeHighlight from "@/features/reading/rehypeHighlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { Element, ElementContent } from "hast";
import type { PluggableList } from "unified";

/** Flattens a highlighted subtree back to the source the reader would copy. */
function collectText(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(collectText).join("");
  return "";
}

function languageOf(node: Element | undefined): string | null {
  const code = node?.children.find((child): child is Element => child.type === "element" && child.tagName === "code");
  const classes = code?.properties?.className;
  const list = Array.isArray(classes) ? classes.map(String) : typeof classes === "string" ? [classes] : [];
  const match = list.find((name) => name.startsWith("language-"));
  return match ? match.slice("language-".length) : null;
}

/**
 * A code block plus the two things a theory reader actually wants from one: to
 * see which language it is, and to take it with them.
 */
function CodeBlock({ node, children }: { node?: Element; children?: ReactNode }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const language = languageOf(node);
  const source = useMemo(() => (node ? node.children.map(collectText).join("") : ""), [node]);

  // The confirmation is a timer, so it has to be cleared if the reader
  // navigates away between the click and the reset.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(() => {
    // Older or insecure contexts have no clipboard API; failing quietly is
    // better than an exception in the middle of a lesson.
    void navigator.clipboard?.writeText(source).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }, [source]);

  return (
    <figure className="code-block">
      <figcaption className="code-block__bar">
        <span className="code-block__lang">{language ?? t("reader.code")}</span>
        <button
          type="button"
          className={`code-block__copy ${copied ? "code-block__copy--done" : ""}`}
          onClick={copy}
          aria-label={t("reader.copyCode")}
        >
          {copied ? <Check size={13} weight="bold" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          <span>{copied ? t("reader.copied") : t("reader.copy")}</span>
        </button>
      </figcaption>
      <pre>{children}</pre>
    </figure>
  );
}

const components: Components = {
  pre: CodeBlock,
  // A wide table must scroll inside its own box rather than widening the page;
  // the tabindex makes that box reachable without a pointer.
  table: ({ children }) => (
    <div className="table-scroll" role="region" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),
  a: ({ href = "", children }) =>
    href.startsWith("#/") ? (
      <Link to={href.slice(1)}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    ),
};

const plugins: PluggableList = [remarkGfm];
const rehypePlugins: PluggableList = [rehypeRaw, rehypeHighlight];

/**
 * Memoised: the lesson body never changes while the page is open, and re-parsing
 * a few hundred lines of markdown on an unrelated state change (the completion
 * button, a copy confirmation) is pure waste.
 *
 * No sanitiser: the content is markdown committed to this repository, not user
 * input. That assumption is the reason `src/content/` must stay in the repo.
 */
export const MarkdownViewer = memo(function MarkdownViewer({ body }: { body: string }) {
  return (
    <div className="markdown-viewer">
      <Markdown remarkPlugins={plugins} rehypePlugins={rehypePlugins} components={components}>
        {body}
      </Markdown>
    </div>
  );
});
