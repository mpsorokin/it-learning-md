import { createLowlight } from "lowlight";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import typescript from "highlight.js/lib/languages/typescript";
import { visit } from "unist-util-visit";
import type { Element, ElementContent, Root } from "hast";

/**
 * Syntax highlighting for exactly the languages this curriculum writes.
 *
 * `rehype-highlight` would do the same job, but it imports lowlight's `common`
 * set as its fallback — a live reference the bundler cannot drop — so all 37
 * grammars ship whether or not they are asked for. That was ~60% of the
 * markdown chunk for languages no lesson uses.
 *
 * `typescript` also covers `ts`; `plaintext` registers `text` and `txt`. Adding
 * a language is one import and one entry here — and `tests/content.test.mjs`
 * fails if a lesson uses a fence language that is missing, so a gap is a red
 * test rather than a block that quietly renders unstyled.
 */
export const LANGUAGES = { json, plaintext, typescript };

const lowlight = createLowlight(LANGUAGES);

/**
 * Whether a fence label resolves to a grammar. Uses `registered` rather than
 * `listLanguages`, which reports canonical names only — `ts` and `text` are
 * aliases and would look unsupported.
 */
export const isSupportedLanguage = (name: string): boolean => lowlight.registered(name);

/** `false` means an explicit opt-out, `undefined` means no language was given. */
function languageOf(node: Element): string | false | undefined {
  const classes = node.properties?.className;
  if (!Array.isArray(classes)) return undefined;

  let name: string | undefined;
  for (const entry of classes) {
    const value = String(entry);
    if (value === "no-highlight" || value === "nohighlight") return false;
    if (!name && value.startsWith("language-")) name = value.slice("language-".length);
    if (!name && value.startsWith("lang-")) name = value.slice("lang-".length);
  }
  return name;
}

export default function rehypeHighlight() {
  return function transform(tree: Root) {
    visit(tree, "element", (node: Element, _index, parent) => {
      if (node.tagName !== "code") return;
      if (!parent || parent.type !== "element" || parent.tagName !== "pre") return;

      const language = languageOf(node);
      // No language and no opt-out: nothing to do. Auto-detection is not worth
      // its weight here — every fence in the curriculum is labelled.
      if (!language) return;
      // An unregistered language renders plain rather than throwing: a lesson
      // must never fail to open over a fence label.
      if (!isSupportedLanguage(language)) return;

      const classes = Array.isArray(node.properties.className) ? node.properties.className : [];
      node.properties.className = classes.includes("hljs") ? classes : ["hljs", ...classes];

      const result = lowlight.highlight(language, toText(node));
      if (result.children.length > 0) node.children = result.children as ElementContent[];
    });
  };
}

/** The fence's source, before any highlighting markup is layered over it. */
function toText(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(toText).join("");
  return "";
}
