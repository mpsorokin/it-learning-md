/**
 * A deliberately small frontmatter reader for the subset used by lessons:
 * scalar `key: value` pairs and string lists written either as `[]` or as
 * indented `- item` lines. Pulling a full YAML parser into the reader bundle
 * would be disproportionate for this controlled, repository-owned format.
 *
 * Values may be quoted; anything after the first `:` is taken verbatim, so a
 * title containing a colon needs no escaping.
 */

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface ParsedMarkdown {
  data: Record<string, string | string[]>;
  body: string;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return quoted && trimmed.length >= 2 ? trimmed.slice(1, -1) : trimmed;
}

export function parseFrontmatter(source: string): ParsedMarkdown {
  const match = FENCE.exec(source);
  if (!match) return { data: {}, body: source.trim() };

  const data: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (listKey && trimmed.startsWith("- ")) {
      const list = data[listKey];
      if (Array.isArray(list)) list.push(unquote(trimmed.slice(2)));
      continue;
    }

    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = unquote(trimmed.slice(separator + 1));
    listKey = null;
    if (!value || value === "[]") {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = value;
    }
  }

  return { data, body: source.slice(match[0].length).trim() };
}

export function frontmatterString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function frontmatterList(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

/**
 * `order` is optional in the file: a `NN-` filename prefix is the usual way to
 * express it, and duplicating that number in the frontmatter is one more thing
 * to keep in sync. Files with neither fall to the end, alphabetically.
 */
export function resolveOrder(explicit: string | undefined, slug: string): number {
  if (explicit !== undefined) {
    const parsed = Number.parseInt(explicit, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  const prefix = /^(\d+)[-_.]/.exec(slug);
  if (prefix) return Number.parseInt(prefix[1], 10);
  return Number.MAX_SAFE_INTEGER;
}

/** `some-folder-name` → `Some Folder Name`, the fallback when no title is translated. */
export function humanizeSlug(slug: string): string {
  return slug
    .replace(/^\d+[-_.]/, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
