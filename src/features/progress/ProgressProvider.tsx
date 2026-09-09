import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clamp01 } from "@/lib/num";
import { subscribeToStorage } from "@/lib/storage";
import {
  clearProgress,
  mergeProgressLessons,
  parseProgressState,
  PROGRESS_STORAGE_KEY,
  readProgress,
  writeProgress,
} from "@/features/progress/progress.storage";
import { emptyProgress, type ProgressState } from "@/features/progress/progress.types";

export interface ProgressActions {
  completeLesson: (id: string) => void;
  resetLesson: (id: string) => void;
  setLessonScroll: (id: string, ratio: number) => void;
  replaceProgress: (state: ProgressState) => void;
  resetAll: () => void;
  /** The live value without subscribing — used by the reader to seed local state. */
  getProgressSnapshot: () => ProgressState;
}

export const ProgressStateContext = createContext<ProgressState | null>(null);
export const ProgressActionsContext = createContext<ProgressActions | null>(null);

/**
 * State and actions live in two contexts on purpose. The lesson page only ever
 * *writes*, so `useProgressActions()` gives it a value that is created once and
 * never changes — ticking a lesson does not re-render every screen holding an
 * action reference, only the ones actually reading the numbers.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(readProgress);
  // The ref is the source of truth between renders, so an action can read the
  // current value without closing over a stale `state`.
  const ref = useRef(state);

  const commit = useCallback((next: ProgressState) => {
    ref.current = next;
    setState(next);
    writeProgress(next);
  }, []);

  const actions = useMemo<ProgressActions>(
    () => ({
      completeLesson: (id) => {
        const now = new Date().toISOString();
        const existing = ref.current.lessons[id];
        // Re-ticking an already-finished lesson must not move its completedAt:
        // "last completed" would otherwise jump around on a re-read.
        if (existing?.completedAt) return;
        commit({
          ...ref.current,
          lessons: {
            ...ref.current.lessons,
            [id]: {
              completedAt: now,
              updatedAt: now,
              scrollRatio: 1,
            },
          },
        });
      },
      resetLesson: (id) => {
        const existing = ref.current.lessons[id];
        if (!existing?.completedAt) return;
        const now = new Date().toISOString();
        commit({
          ...ref.current,
          lessons: {
            ...ref.current.lessons,
            [id]: {
              completedAt: null,
              updatedAt: now,
              scrollRatio: existing.scrollRatio,
            },
          },
        });
      },
      setLessonScroll: (id, ratio) => {
        const existing = ref.current.lessons[id];
        if (existing?.completedAt) return;
        const now = new Date().toISOString();
        const scrollRatio = clamp01(ratio);
        commit({
          ...ref.current,
          lessons: {
            ...ref.current.lessons,
            [id]: {
              completedAt: null,
              updatedAt: now,
              scrollRatio,
            },
          },
        });
      },
      replaceProgress: (next) => commit(next),
      resetAll: () => {
        ref.current = emptyProgress();
        setState(ref.current);
        clearProgress();
      },
      getProgressSnapshot: () => ref.current,
    }),
    [commit],
  );

  useEffect(
    () =>
      // Another tab's snapshot is merged in *without* writing back, so two open
      // tabs converge instead of overwriting each other in a loop.
      subscribeToStorage(PROGRESS_STORAGE_KEY, (raw) => {
        if (raw === null) {
          ref.current = emptyProgress();
          setState(ref.current);
          return;
        }
        try {
          const incoming = parseProgressState(JSON.parse(raw) as unknown);
          if (!incoming) return;
          const merged: ProgressState = {
            version: 1,
            lessons: mergeProgressLessons(ref.current.lessons, incoming.lessons),
          };
          ref.current = merged;
          setState(merged);
        } catch {
          // A tab that wrote garbage is not a reason to drop what we have.
        }
      }),
    [],
  );

  return (
    <ProgressStateContext.Provider value={state}>
      <ProgressActionsContext.Provider value={actions}>{children}</ProgressActionsContext.Provider>
    </ProgressStateContext.Provider>
  );
}
