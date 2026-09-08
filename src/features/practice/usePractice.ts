import { useContext } from "react";
import { PracticeActionsContext, PracticeStateContext, type PracticeActions } from "@/features/practice/PracticeProvider";
import type { PracticeState } from "@/features/practice/practice.types";

export function usePracticeState(): PracticeState {
  const state = useContext(PracticeStateContext);
  if (!state) throw new Error("usePracticeState must be used inside <PracticeProvider>.");
  return state;
}

export function usePracticeActions(): PracticeActions {
  const actions = useContext(PracticeActionsContext);
  if (!actions) throw new Error("usePracticeActions must be used inside <PracticeProvider>.");
  return actions;
}
