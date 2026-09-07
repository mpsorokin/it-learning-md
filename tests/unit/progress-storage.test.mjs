import test from "node:test";
import assert from "node:assert/strict";
import { installFakeStorage } from "../support/fake-storage.mjs";
import { backupKeyFor } from "@/lib/storage";
import { PROGRESS_STORAGE_KEY, parseProgressState, readProgress, writeProgress } from "@/features/progress/progress.storage";

const entry = (at = "2026-01-01T00:00:00.000Z") => ({ completedAt: at, updatedAt: at });

test("a round trip preserves the store", () => {
  installFakeStorage();
  const state = { version: 1, lessons: { "ts/basic/01": entry() } };
  writeProgress(state);
  assert.deepEqual(readProgress(), state);
});

test("an empty slot yields an empty store", () => {
  installFakeStorage();
  assert.deepEqual(readProgress(), { version: 1, lessons: {} });
});

test("an unreadable blob is preserved instead of being overwritten", () => {
  const storage = installFakeStorage();
  // A *newer* schema is the case that matters: this build cannot read it, and
  // must not be the reason the learner loses it.
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 99, lessons: { a: entry() } }));

  assert.deepEqual(readProgress(), { version: 1, lessons: {} }, "the app still starts");
  assert.equal(JSON.parse(storage.getItem(backupKeyFor(PROGRESS_STORAGE_KEY))).version, 99);
});

test("unparseable JSON is preserved too", () => {
  const storage = installFakeStorage();
  storage.setItem(PROGRESS_STORAGE_KEY, "{ not json");

  assert.deepEqual(readProgress(), { version: 1, lessons: {} });
  assert.equal(storage.getItem(backupKeyFor(PROGRESS_STORAGE_KEY)), "{ not json");
});

test("the first unreadable blob wins the backup slot", () => {
  const storage = installFakeStorage();
  storage.setItem(PROGRESS_STORAGE_KEY, "first");
  readProgress();
  storage.setItem(PROGRESS_STORAGE_KEY, "second");
  readProgress();

  assert.equal(storage.getItem(backupKeyFor(PROGRESS_STORAGE_KEY)), "first");
});

test("a malformed entry is dropped without losing the rest", () => {
  const parsed = parseProgressState({
    version: 1,
    lessons: { good: entry(), bad: { completedAt: "" }, alsoBad: 7 },
  });

  assert.deepEqual(Object.keys(parsed.lessons), ["good"]);
});

test("anything that is not this schema is rejected", () => {
  assert.equal(parseProgressState(null), null);
  assert.equal(parseProgressState([]), null);
  assert.equal(parseProgressState({ version: 2, lessons: {} }), null);
  assert.equal(parseProgressState({ version: 1 }), null);
});
