import { isDate, isRecord, readStored, removeStored, writeStored } from "@/lib/storage";
import {
  emptyPractice,
  PRACTICE_STORAGE_KEY,
  PRACTICE_VERSION,
  type PracticeDailyGoal,
  type PracticeRating,
  type PracticeState,
} from "@/features/practice/practice.types";

const isRating = (value: unknown): value is PracticeRating =>
  value === "again" || value === "hard" || value === "known";

const isDailyGoal = (value: unknown): value is PracticeDailyGoal => value === 3 || value === 5 || value === 10;

function parseAttempt(value: unknown) {
  if (!isRecord(value)) return null;
  if (typeof value.questionId !== "string" || value.questionId.length === 0) return null;
  if (!isRating(value.rating)) return null;
  if (!isDate(value.answeredAt) || !isDate(value.studyDate) || !isDate(value.updatedAt)) return null;
  return {
    questionId: value.questionId,
    rating: value.rating,
    answeredAt: value.answeredAt,
    studyDate: value.studyDate,
    updatedAt: value.updatedAt,
  };
}

export function parsePracticeState(value: unknown): PracticeState | null {
  if (!isRecord(value)) return null;
  if (value.version !== PRACTICE_VERSION || !isDailyGoal(value.dailyGoal) || !isRecord(value.attempts)) return null;

  const attempts: PracticeState["attempts"] = {};
  for (const [id, entry] of Object.entries(value.attempts)) {
    const parsed = parseAttempt(entry);
    if (parsed) attempts[id] = parsed;
  }

  return { version: PRACTICE_VERSION, dailyGoal: value.dailyGoal, attempts };
}

export function readPractice(): PracticeState {
  return readStored(PRACTICE_STORAGE_KEY, parsePracticeState, emptyPractice);
}

export function writePractice(state: PracticeState): void {
  writeStored(PRACTICE_STORAGE_KEY, state);
}

export function clearPractice(): void {
  removeStored(PRACTICE_STORAGE_KEY);
}
