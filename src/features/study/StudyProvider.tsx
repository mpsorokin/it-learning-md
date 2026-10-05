import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MAX_NOTE_LENGTH,
  mergeStudyLessons,
  parseStudyState,
  readStudy,
  writeStudy,
} from "@/features/study/study.storage";
import { emptyStudy, STUDY_STORAGE_KEY, type StudyState } from "@/features/study/study.types";
import { preserveStoredRaw, subscribeToStorage } from "@/lib/storage";

export interface StudyActions {
  setNote: (lessonId: string, note: string) => boolean;
  setBookmarked: (lessonId: string, bookmarked: boolean) => void;
  replaceStudy: (state: StudyState) => void;
}

export const StudyStateContext = createContext<StudyState | null>(null);
export const StudyActionsContext = createContext<StudyActions | null>(null);

function createWriterId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudyState>(readStudy);
  const ref = useRef(state);
  const writerId = useRef(createWriterId());

  const commitLesson = useCallback(
    (
      lessonId: string,
      patch: Partial<Pick<StudyState["lessons"][string], "note" | "bookmarked">>,
    ) => {
      const previous = ref.current.lessons[lessonId];
      const lesson = {
        note: patch.note ?? previous?.note ?? "",
        bookmarked: patch.bookmarked ?? previous?.bookmarked ?? false,
        updatedAt: new Date().toISOString(),
        writerId: writerId.current,
      };
      const next: StudyState = {
        version: 1,
        lessons: { ...ref.current.lessons, [lessonId]: lesson },
      };
      ref.current = next;
      setState(next);
      return writeStudy(next);
    },
    [],
  );

  const actions = useMemo<StudyActions>(
    () => ({
      setNote: (lessonId, note) => {
        if (note.length > MAX_NOTE_LENGTH) return false;
        return commitLesson(lessonId, { note });
      },
      setBookmarked: (lessonId, bookmarked) => {
        void commitLesson(lessonId, { bookmarked });
      },
      replaceStudy: (next) => {
        ref.current = next;
        setState(next);
        void writeStudy(next);
      },
    }),
    [commitLesson],
  );

  useEffect(
    () =>
      subscribeToStorage(STUDY_STORAGE_KEY, (raw) => {
        if (raw === null) {
          ref.current = emptyStudy();
          setState(ref.current);
          return;
        }
        try {
          const incoming = parseStudyState(JSON.parse(raw) as unknown);
          if (!incoming) {
            preserveStoredRaw(STUDY_STORAGE_KEY, raw);
            return;
          }
          const merged: StudyState = {
            version: 1,
            lessons: mergeStudyLessons(ref.current.lessons, incoming.lessons),
          };
          ref.current = merged;
          setState(merged);
          if (JSON.stringify(merged.lessons) !== JSON.stringify(incoming.lessons))
            writeStudy(merged);
        } catch {
          preserveStoredRaw(STUDY_STORAGE_KEY, raw);
        }
      }),
    [],
  );

  return (
    <StudyStateContext.Provider value={state}>
      <StudyActionsContext.Provider value={actions}>{children}</StudyActionsContext.Provider>
    </StudyStateContext.Provider>
  );
}
