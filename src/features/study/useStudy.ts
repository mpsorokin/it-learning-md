import { useContext } from "react";
import { StudyActionsContext, StudyStateContext } from "@/features/study/StudyProvider";

export function useStudyState() {
  const value = useContext(StudyStateContext);
  if (!value) throw new Error("useStudyState must be used inside StudyProvider");
  return value;
}

export function useStudyActions() {
  const value = useContext(StudyActionsContext);
  if (!value) throw new Error("useStudyActions must be used inside StudyProvider");
  return value;
}
