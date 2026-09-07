import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const pluralSuffix = /_(zero|one|two|few|many|other)$/;

function flattenKeys(value, prefix = "") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
      return flattenKeys(nested, next);
    }
    return [next];
  });
}

const baseKeys = (keys) => new Set([...keys].map((key) => key.replace(pluralSuffix, "")));

const en = JSON.parse(await readFile(join(root, "src", "i18n", "locales", "en.json"), "utf8"));
const ru = JSON.parse(await readFile(join(root, "src", "i18n", "locales", "ru.json"), "utf8"));

const enBase = baseKeys(flattenKeys(en));
const ruBase = baseKeys(flattenKeys(ru));

test("locale files expose the same translation keys", () => {
  const missingInRu = [...enBase].filter((key) => !ruBase.has(key));
  const missingInEn = [...ruBase].filter((key) => !enBase.has(key));

  assert.deepEqual(missingInRu, [], `Missing in ru.json: ${missingInRu.join(", ")}`);
  assert.deepEqual(missingInEn, [], `Missing in en.json: ${missingInEn.join(", ")}`);
});

/**
 * Key-set symmetry alone cannot catch a key that the code uses but neither file
 * defines, nor a key both files carry that nothing renders any more. Both drift
 * silently and only show up as a raw dotted string on screen, so the source is
 * scanned here too.
 */
const SOURCE_ROOT = join(root, "src");

/** Keys assembled at runtime; the prefix is all the scanner can see. */
const DYNAMIC_KEY_PREFIXES = ["content."];

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === "content" ? [] : sourceFiles(full);
      return /\.tsx?$/.test(entry.name) ? [full] : [];
    }),
  );
  return files.flat();
}

/** Keys passed straight to `t()` or to a `labelKey` table — definitely keys. */
function calledKeys(source) {
  const keys = new Set();
  for (const match of source.matchAll(/\bt\(\s*["'`]([A-Za-z0-9_.]+)["'`]/g)) keys.add(match[1]);
  for (const match of source.matchAll(/\blabelKey:\s*["']([A-Za-z0-9_.]+)["']/g)) keys.add(match[1]);
  return keys;
}

/** Every quoted literal, so a key chosen by a ternary before `t()` still counts. */
function quotedLiterals(source) {
  const literals = new Set();
  for (const match of source.matchAll(/["'`]([A-Za-z0-9_.]+)["'`]/g)) literals.add(match[1]);
  return literals;
}

const files = await sourceFiles(SOURCE_ROOT);
const called = new Set();
const mentioned = new Set();
for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const key of calledKeys(source)) called.add(key);
  for (const literal of quotedLiterals(source)) mentioned.add(literal);
}

test("every key used in the source exists in the locale files", () => {
  const missing = [...called].filter((key) => !enBase.has(key)).sort();
  assert.deepEqual(missing, [], `Used in src/ but missing from en.json: ${missing.join(", ")}`);
});

test("every key in the locale files is actually rendered", () => {
  const isDynamic = (key) => DYNAMIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
  const unused = [...enBase].filter((key) => !mentioned.has(key) && !isDynamic(key)).sort();
  assert.deepEqual(unused, [], `Defined but never rendered: ${unused.join(", ")}`);
});
