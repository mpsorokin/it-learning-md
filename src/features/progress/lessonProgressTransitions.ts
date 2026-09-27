import type { ProgressState } from "@/features/progress/progress.types";

/** Pure lesson-level transitions shared by the progress actions and tests. */
export function completeLessonProgress(state: ProgressState, id: string, now: string): ProgressState {
  const existing = state.lessons[id];
  if (existing?.completedAt) return state;

  return {
    ...state,
    lessons: {
      ...state.lessons,
      [id]: { completedAt: now, updatedAt: now, scrollRatio: 1 },
    },
  };
}

export function resetLessonProgress(state: ProgressState, id: string, now: string): ProgressState {
  const existing = state.lessons[id];
  if (!existing?.completedAt) return state;

  return {
    ...state,
    lessons: {
      ...state.lessons,
      [id]: { completedAt: null, updatedAt: now, scrollRatio: existing.scrollRatio },
    },
  };
}
