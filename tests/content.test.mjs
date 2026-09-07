/**
 * Guards the conventions `src/lib/content.ts` relies on. The runtime is
 * forgiving by design — a stray file is warned about, not fatal — so the checks
 * that would otherwise never surface live here instead.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const CONTENT_ROOT = join(process.cwd(), "src", "content");

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return markdownFiles(full);
      return entry.name.endsWith(".md") ? [full] : [];
    }),
  );
  return nested.flat();
}

/** Mirrors `parseFrontmatter` — the app parses the same way, in TypeScript. */
function frontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator > 0) data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return data;
}

const files = await markdownFiles(CONTENT_ROOT);
const lessons = await Promise.all(
  files.map(async (file) => {
    const parts = relative(CONTENT_ROOT, file).split(sep);
    return { file, parts, data: frontmatter(await readFile(file, "utf8")) };
  }),
);

test("there is content to render", () => {
  assert.ok(lessons.length > 0, "src/content is empty");
});

test("every lesson sits at content/<section>/<folder>/<slug>.md", () => {
  const misplaced = lessons.filter((lesson) => lesson.parts.length !== 3).map((lesson) => lesson.parts.join("/"));
  assert.deepEqual(misplaced, [], `Wrong depth — these would be skipped at runtime: ${misplaced.join(", ")}`);
});

test("every lesson has frontmatter with a title", () => {
  const untitled = lessons.filter((lesson) => !lesson.data?.title).map((lesson) => lesson.parts.join("/"));
  assert.deepEqual(untitled, [], `Missing a title: ${untitled.join(", ")}`);
});

test("no two lessons in a folder claim the same order", () => {
  const seen = new Map();
  const clashes = [];
  for (const lesson of lessons) {
    if (lesson.parts.length !== 3 || !lesson.data?.order) continue;
    const key = `${lesson.parts[0]}/${lesson.parts[1]}#${lesson.data.order}`;
    if (seen.has(key)) clashes.push(`${key} — ${seen.get(key)} and ${lesson.parts[2]}`);
    else seen.set(key, lesson.parts[2]);
  }
  assert.deepEqual(clashes, [], `Duplicate order: ${clashes.join("; ")}`);
});

test("lesson ids are unique", () => {
  const ids = lessons.map((lesson) => lesson.parts.join("/").replace(/\.md$/, ""));
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, [], `Duplicate id: ${duplicates.join(", ")}`);
});
