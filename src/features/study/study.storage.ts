import { isDate, isRecord, readStored, writeStored } from "@/lib/storage";
import { emptyStudy, STUDY_STORAGE_KEY, STUDY_VERSION, type LessonStudyData, type StudyState } from "@/features/study/study.types";

export const MAX_NOTE_LENGTH = 10_000;

function parseLessonStudy(value: unknown): LessonStudyData | null {
  if (!isRecord(value)) return null;
  if (typeof value.note !== "string" || value.note.length > MAX_NOTE_LENGTH) return null;
  if (typeof value.bookmarked !== "boolean" || !isDate(value.updatedAt) || !isDate(value.writerId)) return null;
  return {
    note: value.note,
    bookmarked: value.bookmarked,
    updatedAt: value.updatedAt,
    writerId: value.writerId,
  };
}

export function parseStudyState(value: unknown): StudyState | null {
  if (!isRecord(value) || value.version !== STUDY_VERSION || !isRecord(value.lessons)) return null;
  const lessons: Record<string, LessonStudyData> = {};
  for (const [id, entry] of Object.entries(value.lessons)) {
    if (!id) continue;
    const parsed = parseLessonStudy(entry);
    if (parsed) lessons[id] = parsed;
  }
  return { version: STUDY_VERSION, lessons };
}

export function mergeStudyLessons(
  local: Record<string, LessonStudyData>,
  incoming: Record<string, LessonStudyData>,
): Record<string, LessonStudyData> {
  const merged: Record<string, LessonStudyData> = { ...incoming };
  for (const [id, entry] of Object.entries(local)) {
    const other = merged[id];
    if (!other || entry.updatedAt > other.updatedAt || (entry.updatedAt === other.updatedAt && entry.writerId > other.writerId)) {
      merged[id] = entry;
    }
  }
  return merged;
}

export function readStudy(): StudyState {
  return readStored(STUDY_STORAGE_KEY, parseStudyState, emptyStudy);
}

export function writeStudy(state: StudyState): boolean {
  return writeStored(STUDY_STORAGE_KEY, state);
}
