import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { mergeRecords, subscribeToStorage } from "@/lib/storage";
import { clearPractice, parsePracticeState, readPractice, writePractice } from "@/features/practice/practice.storage";
import { emptyPractice, PRACTICE_STORAGE_KEY, type PracticeDailyGoal, type PracticeRating, type PracticeState } from "@/features/practice/practice.types";
import { dayKey } from "@/features/practice/practice.metrics";

export interface PracticeActions {
  recordAttempt: (questionId: string, rating: PracticeRating) => void;
  setDailyGoal: (goal: PracticeDailyGoal) => void;
  replacePractice: (state: PracticeState) => void;
  resetPractice: () => void;
  getPracticeSnapshot: () => PracticeState;
}

export const PracticeStateContext = createContext<PracticeState | null>(null);
export const PracticeActionsContext = createContext<PracticeActions | null>(null);

function newAttemptId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PracticeState>(readPractice);
  const ref = useRef(state);

  const commit = useCallback((next: PracticeState) => {
    ref.current = next;
    setState(next);
    writePractice(next);
  }, []);

  const actions = useMemo<PracticeActions>(() => ({
    recordAttempt: (questionId, rating) => {
      const now = new Date().toISOString();
      const attempt = { questionId, rating, answeredAt: now, studyDate: dayKey(), updatedAt: now };
      commit({ ...ref.current, attempts: { ...ref.current.attempts, [newAttemptId()]: attempt } });
    },
    setDailyGoal: (dailyGoal) => commit({ ...ref.current, dailyGoal }),
    replacePractice: (next) => commit(next),
    resetPractice: () => {
      ref.current = emptyPractice();
      setState(ref.current);
      clearPractice();
    },
    getPracticeSnapshot: () => ref.current,
  }), [commit]);

  useEffect(
    () => subscribeToStorage(PRACTICE_STORAGE_KEY, (raw) => {
      if (raw === null) {
        ref.current = emptyPractice();
        setState(ref.current);
        return;
      }
      try {
        const incoming = parsePracticeState(JSON.parse(raw) as unknown);
        if (!incoming) return;
        const merged = {
          version: 1 as const,
          dailyGoal: incoming.dailyGoal,
          attempts: mergeRecords(ref.current.attempts, incoming.attempts),
        };
        ref.current = merged;
        setState(merged);
      } catch {
        // Keep the current tab's valid history when another tab writes garbage.
      }
    }),
    [],
  );

  return (
    <PracticeStateContext.Provider value={state}>
      <PracticeActionsContext.Provider value={actions}>{children}</PracticeActionsContext.Provider>
    </PracticeStateContext.Provider>
  );
}
