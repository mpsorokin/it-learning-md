import type { Folder, Lesson, Section } from "@/lib/content.types";
import type { LessonProgress, ProgressState } from "@/features/progress/progress.types";

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

export interface ReadingHistoryRow {
  date: string;
  count: number;
  cumulative: number;
}

const localDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftLocalDay = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDayKey(date);
};

const lessonEntry = (progress: ProgressState, lessonId: string): LessonProgress | undefined =>
  progress.lessons[lessonId];

const tally = (lessons: Lesson[], progress: ProgressState): Tally => {
  const done = lessons.reduce((count, lesson) => (isCompleted(progress, lesson.id) ? count + 1 : count), 0);
  return { done, total: lessons.length, ratio: lessons.length === 0 ? 1 : done / lessons.length };
};

export const isCompleted = (progress: ProgressState, lessonId: string): boolean =>
  Boolean(lessonEntry(progress, lessonId)?.completedAt);

export const lessonScrollRatio = (progress: ProgressState, lessonId: string): number => {
  const entry = lessonEntry(progress, lessonId);
  if (!entry) return 0;
  if (entry.completedAt) return 1;
  return entry.scrollRatio;
};

export const folderProgress = (progress: ProgressState, folder: Folder): Tally => tally(folder.lessons, progress);

export const sectionProgress = (progress: ProgressState, section: Section): Tally => tally(section.lessons, progress);

export const overallProgress = (progress: ProgressState, lessons: Lesson[]): Tally => tally(lessons, progress);

/**
 * Returns active reading days in the last 28 local calendar days, newest first.
 * The cumulative value is the all-time completed-lesson count as of that day.
 */
export function readingHistory(
  progress: ProgressState,
  lessons: Lesson[],
  now = new Date(),
): ReadingHistoryRow[] {
  const today = localDayKey(now);
  const firstDay = shiftLocalDay(today, -27);
  const completedDates = lessons.flatMap((lesson) => {
    const completed = lessonEntry(progress, lesson.id);
    if (!completed?.completedAt) return [];
    return [{ date: localDayKey(new Date(completed.completedAt)) }];
  });
  const counts = new Map<string, number>();

  for (const { date } of completedDates) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const activeDates = [...counts.keys()]
    .filter((date) => date >= firstDay && date <= today && (counts.get(date) ?? 0) > 0)
    .sort();
  let cumulative = completedDates.filter(({ date }) => date < firstDay).length;

  const rows = activeDates.map((date) => {
    cumulative += completedDates.filter(({ date: completedDate }) => completedDate === date).length;
    return { date, count: counts.get(date) ?? 0, cumulative };
  });

  return rows.reverse();
}

/**
 * Where "continue" points: the first unfinished lesson in reading order. Nothing
 * is left over once every lesson is done, so callers hide the entry point.
 */
export const getNextLesson = (progress: ProgressState, lessons: Lesson[]): Lesson | undefined =>
  lessons.find((lesson) => !isCompleted(progress, lesson.id));

/** The most recently ticked lesson, by `completedAt`. */
export function getLastCompleted(progress: ProgressState, lessons: Lesson[]): Lesson | undefined {
  let best: Lesson | undefined;
  let bestAt = "";
  for (const lesson of lessons) {
    const entry = lessonEntry(progress, lesson.id);
    if (entry?.completedAt && entry.completedAt > bestAt) {
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
