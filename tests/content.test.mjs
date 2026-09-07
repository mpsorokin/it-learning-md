/** Guards the filesystem curriculum and the metadata consumed by content.ts. */
import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative, sep } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const CONTENT_ROOT = join(process.cwd(), "src", "content");
const EXPECTED_FOLDERS = new Map([
  ["01-foundation", { section: "foundation", count: 13 }],
  ["02-narrowing", { section: "narrowing", count: 7 }],
  ["03-generics", { section: "generics", count: 6 }],
  ["04-advanced-types", { section: "advanced-types", count: 6 }],
  ["05-practical", { section: "practical", count: 8 }],
]);
const DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);
const REQUIRED_HEADINGS = ["TL;DR", "Mental model", "Core idea", "Example 1 — Basic", "Example 2 — Real-world", "Common mistake", "Interview answer", "Interview follow-ups", "Recall", "Mini challenge", "Remember", "Related topics"];

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(full);
    return entry.name.endsWith(".md") ? [full] : [];
  }));
  return nested.flat();
}

function parse(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: null, body: source };
  const data = {};
  let listKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (listKey && trimmed.startsWith("- ")) {
      data[listKey].push(trimmed.slice(2));
      continue;
    }
    const separator = trimmed.indexOf(":");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    listKey = null;
    if (!value || value === "[]") {
      data[key] = [];
      listKey = key;
    } else data[key] = value;
  }
  return { data, body: source.slice(match[0].length) };
}

function sectionBody(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^## ${escaped}\\r?\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m").exec(body)?.[1] ?? "";
}

const files = await markdownFiles(CONTENT_ROOT);
const lessons = await Promise.all(files.map(async (file) => {
  const parts = relative(CONTENT_ROOT, file).split(sep);
  const parsed = parse(await readFile(file, "utf8"));
  return { file, parts, ...parsed };
}));

test("the TypeScript curriculum contains the expected 40 lessons", () => {
  assert.equal(lessons.length, 40);
  assert.ok(lessons.every(({ parts }) => parts[0] === "typescript" && parts.length === 3));
  for (const [folder, expected] of EXPECTED_FOLDERS) {
    const actual = lessons.filter(({ parts }) => parts[1] === folder);
    assert.equal(actual.length, expected.count, folder);
    assert.ok(actual.every(({ data }) => data.section === expected.section), folder);
  }
});

test("frontmatter is complete, valid, and consistent with filenames", () => {
  const required = ["title", "titleRu", "slug", "section", "order", "difficulty", "estimatedMinutes", "tags", "prerequisites"];
  const slugs = new Set();
  const orders = [];
  for (const lesson of lessons) {
    assert.ok(lesson.data, lesson.file);
    for (const key of required) assert.ok(key in lesson.data, `${lesson.file}: missing ${key}`);
    assert.match(lesson.data.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${lesson.file}: invalid slug`);
    assert.equal(basename(lesson.file, ".md").replace(/^\d+-/, ""), lesson.data.slug, lesson.file);
    assert.ok(DIFFICULTIES.has(lesson.data.difficulty), lesson.file);
    assert.ok(Number(lesson.data.estimatedMinutes) >= 3 && Number(lesson.data.estimatedMinutes) <= 7, lesson.file);
    assert.ok(Array.isArray(lesson.data.tags) && lesson.data.tags.includes("typescript"), lesson.file);
    assert.ok(Array.isArray(lesson.data.prerequisites), lesson.file);
    assert.ok(!slugs.has(lesson.data.slug), `duplicate slug: ${lesson.data.slug}`);
    slugs.add(lesson.data.slug);
    orders.push(Number(lesson.data.order));
  }
  assert.deepEqual(orders.sort((a, b) => a - b), Array.from({ length: 40 }, (_, index) => index + 1));
});

test("every lesson follows the learning template", () => {
  for (const { file, body } of lessons) {
    for (const heading of REQUIRED_HEADINGS) {
      const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert.match(body, new RegExp(`^## ${escaped}$`, "m"), `${file}: missing ${heading}`);
    }
    assert.match(body, /<details>\s*\r?\n<summary>Solution<\/summary>[\s\S]*?<\/details>/, `${file}: missing hidden solution`);
    const followUps = sectionBody(body, "Interview follow-ups").match(/^- /gm) ?? [];
    const recall = sectionBody(body, "Recall").match(/^- /gm) ?? [];
    assert.ok(followUps.length >= 2 && followUps.length <= 4, `${file}: follow-ups count`);
    assert.ok(recall.length >= 3 && recall.length <= 5, `${file}: recall count`);
  }
});

test("prerequisites and related-topic links resolve to curriculum lessons", () => {
  const slugs = new Set(lessons.map(({ data }) => data.slug));
  const ids = new Set(lessons.map(({ parts, data }) => `typescript/${parts[1]}/${data.slug}`));
  for (const lesson of lessons) {
    for (const prerequisite of lesson.data.prerequisites) {
      assert.ok(slugs.has(prerequisite), `${lesson.file}: unknown prerequisite ${prerequisite}`);
    }
    const links = [...sectionBody(lesson.body, "Related topics").matchAll(/\(#\/s\/([^/]+\/[^/]+\/[^)]+)\)/g)];
    assert.ok(links.length >= 2 && links.length <= 5, `${lesson.file}: related-topic count`);
    for (const [, id] of links) assert.ok(ids.has(id), `${lesson.file}: broken related link ${id}`);
  }
});
