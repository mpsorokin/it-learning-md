import { useContext } from "react";
import { ProgressActionsContext, ProgressStateContext, type ProgressActions } from "@/features/progress/ProgressProvider";
import type { ProgressState } from "@/features/progress/progress.types";

export function useProgressState(): ProgressState {
  const state = useContext(ProgressStateContext);
  if (!state) throw new Error("useProgressState must be used inside <ProgressProvider>.");
  return state;
}

export function useProgressActions(): ProgressActions {
  const actions = useContext(ProgressActionsContext);
  if (!actions) throw new Error("useProgressActions must be used inside <ProgressProvider>.");
  return actions;
}
