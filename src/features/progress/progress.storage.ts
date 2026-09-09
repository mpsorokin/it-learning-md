import { clamp01 } from "@/lib/num";
import { isDate, isRecord, readStored, removeStored, writeStored } from "@/lib/storage";
import { emptyProgress, PROGRESS_VERSION, type LessonProgress, type ProgressState } from "@/features/progress/progress.types";

export const PROGRESS_STORAGE_KEY = "ittheory:progress:v1";

function parseScrollRatio(value: unknown, completed: boolean): number {
  if (completed) return 1;
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return clamp01(value);
}

function parseLessonProgress(value: unknown): LessonProgress | null {
  if (!isRecord(value)) return null;
  if (!isDate(value.updatedAt)) return null;

  const hasCompletedAt = "completedAt" in value;
  const completedAt = hasCompletedAt ? (isDate(value.completedAt) ? value.completedAt : null) : null;
  const completed = completedAt !== null;
  const scrollRatio = parseScrollRatio(value.scrollRatio, completed);

  return { completedAt, updatedAt: value.updatedAt, scrollRatio };
}

/**
 * Returns `null` for anything unrecognised — including a *newer* schema — so
 * `readStored` preserves the blob instead of letting this session overwrite it.
 * Individual malformed entries are dropped rather than failing the whole store:
 * losing one lesson's tick is better than losing every lesson's.
 */
export function parseProgressState(value: unknown): ProgressState | null {
  if (!isRecord(value)) return null;
  if (value.version !== PROGRESS_VERSION) return null;
  if (!isRecord(value.lessons)) return null;

  const lessons: Record<string, LessonProgress> = {};
  for (const [id, entry] of Object.entries(value.lessons)) {
    const parsed = parseLessonProgress(entry);
    if (parsed) lessons[id] = parsed;
  }
  return { version: PROGRESS_VERSION, lessons };
}

/**
 * Cross-tab merge: any `completedAt` is kept (earlier wins, matching re-tick
 * semantics), `scrollRatio` is the max, and a completed lesson is always full.
 */
export function mergeLessonProgress(local: LessonProgress, incoming: LessonProgress): LessonProgress {
  const completedAt =
    local.completedAt && incoming.completedAt
      ? local.completedAt < incoming.completedAt
        ? local.completedAt
        : incoming.completedAt
      : local.completedAt ?? incoming.completedAt;

  const scrollRatio = completedAt ? 1 : Math.max(local.scrollRatio, incoming.scrollRatio);
  const updatedAt = local.updatedAt > incoming.updatedAt ? local.updatedAt : incoming.updatedAt;

  return { completedAt, updatedAt, scrollRatio };
}

export function mergeProgressLessons(
  local: Record<string, LessonProgress>,
  incoming: Record<string, LessonProgress>,
): Record<string, LessonProgress> {
  const merged: Record<string, LessonProgress> = { ...incoming };
  for (const [id, entry] of Object.entries(local)) {
    const other = merged[id];
    merged[id] = other ? mergeLessonProgress(entry, other) : entry;
  }
  return merged;
}

export function readProgress(): ProgressState {
  return readStored(PROGRESS_STORAGE_KEY, parseProgressState, emptyProgress);
}

export function writeProgress(state: ProgressState): void {
  writeStored(PROGRESS_STORAGE_KEY, state);
}

export function clearProgress(): void {
  removeStored(PROGRESS_STORAGE_KEY);
}
