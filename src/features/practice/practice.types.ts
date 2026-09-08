export type PracticeRating = "again" | "hard" | "known";
export type PracticeDailyGoal = 3 | 5 | 10;

export interface PracticeAttempt {
  questionId: string;
  rating: PracticeRating;
  answeredAt: string;
  studyDate: string;
  updatedAt: string;
}

export interface PracticeState {
  version: 1;
  dailyGoal: PracticeDailyGoal;
  attempts: Record<string, PracticeAttempt>;
}

export const PRACTICE_VERSION = 1;
export const PRACTICE_STORAGE_KEY = "ittheory:practice:v1";

export const emptyPractice = (): PracticeState => ({
  version: PRACTICE_VERSION,
  dailyGoal: 5,
  attempts: {},
});
