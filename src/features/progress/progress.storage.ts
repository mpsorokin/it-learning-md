import { isDate, isRecord, readStored, removeStored, writeStored } from "@/lib/storage";
import { emptyProgress, PROGRESS_VERSION, type LessonProgress, type ProgressState } from "@/features/progress/progress.types";

export const PROGRESS_STORAGE_KEY = "ittheory:progress:v1";

function parseLessonProgress(value: unknown): LessonProgress | null {
  if (!isRecord(value)) return null;
  if (!isDate(value.completedAt) || !isDate(value.updatedAt)) return null;
  return { completedAt: value.completedAt, updatedAt: value.updatedAt };
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

export function readProgress(): ProgressState {
  return readStored(PROGRESS_STORAGE_KEY, parseProgressState, emptyProgress);
}

export function writeProgress(state: ProgressState): void {
  writeStored(PROGRESS_STORAGE_KEY, state);
}

export function clearProgress(): void {
  removeStored(PROGRESS_STORAGE_KEY);
}
