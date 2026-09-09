/**
 * A lesson may be unread, in progress (scroll position saved) or done. `updatedAt`
 * exists so two tabs can be reconciled; `scrollRatio` is 0..1 of the reader scroll.
 */
export interface LessonProgress {
  completedAt: string | null;
  updatedAt: string;
  scrollRatio: number;
}

export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonProgress>;
}

export const PROGRESS_VERSION = 1;

export const emptyProgress = (): ProgressState => ({ version: PROGRESS_VERSION, lessons: {} });
