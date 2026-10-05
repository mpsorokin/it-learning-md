import { describe, expect, it } from "vitest";
import {
  completeLessonProgress,
  resetLessonProgress,
} from "@/features/progress/lessonProgressTransitions";
import { isCompleted } from "@/features/progress/metrics";
import { emptyProgress } from "@/features/progress/progress.types";

describe("lesson progress transitions", () => {
  it("marks a lesson complete and allows it to be reopened", () => {
    const lessonId = "fullstack-interview/01-js-runtime/01-execution-context-stack-scope";
    const completed = completeLessonProgress(emptyProgress(), lessonId, "2026-09-27T12:00:00.000Z");

    expect(isCompleted(completed, lessonId)).toBe(true);
    expect(completed.lessons[lessonId].scrollRatio).toBe(1);

    const reopened = resetLessonProgress(completed, lessonId, "2026-09-27T12:05:00.000Z");
    expect(isCompleted(reopened, lessonId)).toBe(false);
    expect(reopened.lessons[lessonId]).toEqual({
      completedAt: null,
      updatedAt: "2026-09-27T12:05:00.000Z",
      scrollRatio: 1,
    });
  });

  it("leaves an unfinished lesson unchanged when asked to unmark it", () => {
    const lessonId = "fullstack-interview/01-js-runtime/01-execution-context-stack-scope";
    const inProgress = {
      ...emptyProgress(),
      lessons: {
        [lessonId]: { completedAt: null, updatedAt: "2026-09-27T12:00:00.000Z", scrollRatio: 0.35 },
      },
    };
    expect(resetLessonProgress(inProgress, lessonId, "2026-09-27T12:05:00.000Z")).toBe(inProgress);
  });
});
