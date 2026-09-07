/**
 * A lesson is either done or not — there is no partial state to track, which is
 * the whole difference between this viewer and a reader that remembers where
 * you stopped. `updatedAt` exists only so two tabs can be reconciled.
 */
export interface LessonProgress {
  completedAt: string;
  updatedAt: string;
}

export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonProgress>;
}

export const PROGRESS_VERSION = 1;

export const emptyProgress = (): ProgressState => ({ version: PROGRESS_VERSION, lessons: {} });
