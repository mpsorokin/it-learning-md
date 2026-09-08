import test from "node:test";
import assert from "node:assert/strict";
import { createProgressBackup, parseProgressBackup, progressBackupFilename } from "@/features/progress/progressBackup";

const progress = {
  version: 1,
  lessons: { "ts/basic/01": { completedAt: "2026-02-01T10:00:00.000Z", updatedAt: "2026-02-01T10:00:00.000Z" } },
};

test("an exported backup imports back unchanged", () => {
  const restored = parseProgressBackup(JSON.parse(JSON.stringify(createProgressBackup(progress))));

  assert.notEqual(restored, null);
  assert.deepEqual(restored.progress, progress);
});

test("a file from another app is rejected rather than half-applied", () => {
  assert.equal(parseProgressBackup({ kind: "calea-progress", version: 1, exportedAt: "x", progress }), null);
});

test("an unknown backup version is rejected", () => {
  assert.equal(parseProgressBackup({ ...createProgressBackup(progress), version: 2 }), null);
});

test("a backup carrying an unreadable store is rejected whole", () => {
  const backup = { ...createProgressBackup(progress), progress: { version: 99, lessons: {} } };
  assert.equal(parseProgressBackup(backup), null);
});

test("anything that is not an object is rejected", () => {
  assert.equal(parseProgressBackup(null), null);
  assert.equal(parseProgressBackup("{}"), null);
  assert.equal(parseProgressBackup([]), null);
});

test("the filename carries the export date", () => {
  assert.equal(progressBackupFilename(new Date("2026-09-07T12:00:00Z")), "ittheory-progress-2026-09-07.json");
});
