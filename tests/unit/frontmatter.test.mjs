import test from "node:test";
import assert from "node:assert/strict";
import { humanizeSlug, parseFrontmatter, resolveOrder } from "@/lib/frontmatter";

test("reads flat key/value pairs and returns the body without the fence", () => {
  const { data, body } = parseFrontmatter("---\ntitle: Generics\norder: 2\n---\n\n# Generics\n\nText.\n");

  assert.deepEqual(data, { title: "Generics", order: "2" });
  assert.equal(body, "# Generics\n\nText.");
});

test("a title may contain a colon", () => {
  const { data } = parseFrontmatter("---\ntitle: Types: the basics\n---\nbody\n");
  assert.equal(data.title, "Types: the basics");
});

test("quoted values are unwrapped", () => {
  const { data } = parseFrontmatter(`---\ntitle: "Objects, interfaces"\n---\nbody\n`);
  assert.equal(data.title, "Objects, interfaces");
});

test("a file without frontmatter still yields its whole body", () => {
  const { data, body } = parseFrontmatter("# Just markdown\n");
  assert.deepEqual(data, {});
  assert.equal(body, "# Just markdown");
});

test("order falls back to the filename prefix, then to the end of the list", () => {
  assert.equal(resolveOrder("3", "07-anything"), 3, "explicit order wins");
  assert.equal(resolveOrder(undefined, "07-narrowing"), 7);
  assert.equal(resolveOrder(undefined, "narrowing"), Number.MAX_SAFE_INTEGER);
  assert.equal(resolveOrder("not-a-number", "02-x"), 2, "a broken order is ignored, not fatal");
});

test("a slug reads as a title when nothing translates it", () => {
  assert.equal(humanizeSlug("01-primitive-types"), "Primitive Types");
  assert.equal(humanizeSlug("generics"), "Generics");
});
