import type { Folder, Lesson, Section } from "@/lib/content.types";
import type { ProgressState } from "@/features/progress/progress.types";

/**
 * Pure functions over `(progress, content)`. Nothing here touches storage or
 * the glob, so every number on screen can be asserted in a plain Node test with
 * hand-built fixtures.
 */

export interface Tally {
  done: number;
  total: number;
  /** 0..1; an empty folder counts as complete so it cannot drag a section down. */
  ratio: number;
}

const tally = (lessons: Lesson[], progress: ProgressState): Tally => {
  const done = lessons.reduce((count, lesson) => (progress.lessons[lesson.id] ? count + 1 : count), 0);
  return { done, total: lessons.length, ratio: lessons.length === 0 ? 1 : done / lessons.length };
};

export const isCompleted = (progress: ProgressState, lessonId: string): boolean =>
  Boolean(progress.lessons[lessonId]);

export const folderProgress = (progress: ProgressState, folder: Folder): Tally => tally(folder.lessons, progress);

export const sectionProgress = (progress: ProgressState, section: Section): Tally => tally(section.lessons, progress);

export const overallProgress = (progress: ProgressState, lessons: Lesson[]): Tally => tally(lessons, progress);

/**
 * Where "continue" points: the first unfinished lesson in reading order. Nothing
 * is left over once every lesson is done, so callers hide the entry point.
 */
export const getNextLesson = (progress: ProgressState, lessons: Lesson[]): Lesson | undefined =>
  lessons.find((lesson) => !progress.lessons[lesson.id]);

/** The most recently ticked lesson, by `completedAt`. */
export function getLastCompleted(progress: ProgressState, lessons: Lesson[]): Lesson | undefined {
  let best: Lesson | undefined;
  let bestAt = "";
  for (const lesson of lessons) {
    const entry = progress.lessons[lesson.id];
    if (entry && entry.completedAt > bestAt) {
      best = lesson;
      bestAt = entry.completedAt;
    }
  }
  return best;
}

/**
 * Neighbours inside the same folder — the reader's prev/next footer. `index` is
 * returned alongside them because the reader also shows "n of m" and would
 * otherwise scan the same list a second time; it is `-1` when the lesson does
 * not belong to the folder.
 */
export function lessonNeighbours(
  folder: Folder,
  lesson: Lesson,
): { index: number; previous?: Lesson; next?: Lesson } {
  const index = folder.lessons.findIndex((candidate) => candidate.id === lesson.id);
  if (index === -1) return { index };
  return { index, previous: folder.lessons[index - 1], next: folder.lessons[index + 1] };
}
