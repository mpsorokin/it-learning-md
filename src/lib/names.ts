/**
 * Lesson identity comes from the filename (`02-type-annotations.md`), not from
 * anything inside the markdown. These helpers are the whole mapping.
 */

/** `02-type-annotations` → `type-annotations`. */
export function slugFromFilename(fileSlug: string): string {
  const stripped = fileSlug.replace(/^\d+[-_.]/, "");
  return stripped || fileSlug;
}

/** `01-type-inference` → 1. Files with no numeric prefix sort last. */
export function resolveOrder(fileSlug: string): number {
  const prefix = /^(\d+)[-_.]/.exec(fileSlug);
  if (prefix) return Number.parseInt(prefix[1], 10);
  return Number.MAX_SAFE_INTEGER;
}

/** `some-folder-name` → `Some Folder Name`. */
export function humanizeSlug(slug: string): string {
  return slug
    .replace(/^\d+[-_.]/, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** First ATX h1 in the file, otherwise a humanized slug. */
export function titleFromMarkdown(source: string, slug: string): string {
  const match = /^#\s+(.+)$/m.exec(source);
  return match ? match[1].trim() : humanizeSlug(slug);
}
