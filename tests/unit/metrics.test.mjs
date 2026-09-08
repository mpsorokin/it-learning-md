import test from "node:test";
import assert from "node:assert/strict";
import {
  folderProgress,
  getLastCompleted,
  getNextLesson,
  isCompleted,
  lessonNeighbours,
  overallProgress,
  sectionProgress,
} from "@/features/progress/metrics";

const lesson = (folder, order) => ({
  id: `ts/${folder}/0${order}`,
  section: "ts",
  folder,
  slug: `0${order}`,
  title: `Lesson ${order}`,
  order,
  body: "",
});

const basic = { id: "ts/basic", section: "ts", slug: "basic", lessons: [lesson("basic", 1), lesson("basic", 2)] };
const generics = { id: "ts/generics", section: "ts", slug: "generics", lessons: [lesson("generics", 1)] };
const section = { slug: "ts", folders: [basic, generics], lessons: [...basic.lessons, ...generics.lessons] };

const at = (day) => `2026-03-0${day}T09:00:00.000Z`;
const progress = {
  version: 1,
  lessons: {
    "ts/basic/01": { completedAt: at(2), updatedAt: at(2) },
    "ts/generics/01": { completedAt: at(4), updatedAt: at(4) },
  },
};

test("a folder counts only its own lessons", () => {
  assert.deepEqual(folderProgress(progress, basic), { done: 1, total: 2, ratio: 0.5 });
  assert.deepEqual(folderProgress(progress, generics), { done: 1, total: 1, ratio: 1 });
});

test("a section sums its folders", () => {
  assert.deepEqual(sectionProgress(progress, section), { done: 2, total: 3, ratio: 2 / 3 });
});

test("an empty folder counts as complete so it cannot drag a section down", () => {
  const empty = { id: "ts/todo", section: "ts", slug: "todo", lessons: [] };
  assert.deepEqual(folderProgress(progress, empty), { done: 0, total: 0, ratio: 1 });
});

test("overall progress with nothing done is zero, not NaN", () => {
  assert.deepEqual(overallProgress({ version: 1, lessons: {} }, section.lessons), {
    done: 0,
    total: 3,
    ratio: 0,
  });
});

test("continue points at the first unfinished lesson in reading order", () => {
  assert.equal(getNextLesson(progress, section.lessons).id, "ts/basic/02");
});

test("nothing is left to continue once everything is done", () => {
  const all = { version: 1, lessons: Object.fromEntries(section.lessons.map((l) => [l.id, { completedAt: at(1), updatedAt: at(1) }])) };
  assert.equal(getNextLesson(all, section.lessons), undefined);
});

test("the last completed lesson is the newest completedAt, not the last in order", () => {
  assert.equal(getLastCompleted(progress, section.lessons).id, "ts/generics/01");
});

test("neighbours stop at the folder edges", () => {
  assert.deepEqual(lessonNeighbours(basic, basic.lessons[0]), {
    index: 0,
    previous: undefined,
    next: basic.lessons[1],
  });
  assert.deepEqual(lessonNeighbours(basic, basic.lessons[1]), {
    index: 1,
    previous: basic.lessons[0],
    next: undefined,
  });
});

test("a lesson from another folder has no neighbours here", () => {
  assert.deepEqual(lessonNeighbours(basic, generics.lessons[0]), { index: -1 });
});

test("isCompleted reads a single lesson", () => {
  assert.equal(isCompleted(progress, "ts/basic/01"), true);
  assert.equal(isCompleted(progress, "ts/basic/02"), false);
});
