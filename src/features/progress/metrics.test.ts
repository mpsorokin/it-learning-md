import { describe, expect, it } from "vitest";
import { practiceOverviewSummary, practiceQueue } from "@/features/practice/practice.metrics";
import { emptyPractice, type PracticeAttempt } from "@/features/practice/practice.types";
import type { InterviewQuestion } from "@/features/practice/questions";
import { getNextLesson } from "@/features/progress/metrics";
import type { ProgressState } from "@/features/progress/progress.types";
import type { Lesson } from "@/lib/content.types";

const lessons: Lesson[] = [
  {
    id: "ts/folder/first",
    section: "ts",
    folder: "folder",
    slug: "first",
    title: "First",
    order: 1,
    sourcePath: "",
    questionCount: 0,
  },
  {
    id: "ts/folder/second",
    section: "ts",
    folder: "folder",
    slug: "second",
    title: "Second",
    order: 2,
    sourcePath: "",
    questionCount: 0,
  },
  {
    id: "ts/folder/third",
    section: "ts",
    folder: "folder",
    slug: "third",
    title: "Third",
    order: 3,
    sourcePath: "",
    questionCount: 0,
  },
];

describe("study queue and reading resume", () => {
  it("resumes the most recently visited unfinished lesson", () => {
    const progress: ProgressState = {
      version: 1,
      lessons: {
        [lessons[0].id]: {
          completedAt: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
          scrollRatio: 0.2,
        },
        [lessons[1].id]: {
          completedAt: null,
          updatedAt: "2026-01-02T00:00:00.000Z",
          scrollRatio: 0,
        },
        [lessons[2].id]: {
          completedAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
          scrollRatio: 1,
        },
      },
    };
    expect(getNextLesson(progress, lessons)?.id).toBe(lessons[1].id);
    expect(getNextLesson({ version: 1, lessons: {} }, lessons)?.id).toBe(lessons[0].id);
  });

  it("does not schedule a hard answer before its due day", () => {
    const question = (id: string): InterviewQuestion => ({
      id,
      lessonId: lessons[0].id,
      section: "ts",
      folder: "folder",
      prompt: id,
    });
    const questions = [question("hard"), question("unseen")];
    const attempt: PracticeAttempt = {
      questionId: "hard",
      rating: "hard",
      answeredAt: "2026-06-10T12:00:00.000Z",
      studyDate: "2026-06-10",
      updatedAt: "2026-06-10T12:00:00.000Z",
    };
    const practice = { ...emptyPractice(), attempts: { attempt } };
    const progress: ProgressState = {
      version: 1,
      lessons: {
        [lessons[0].id]: {
          completedAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          scrollRatio: 1,
        },
      },
    };
    expect(
      practiceQueue(progress, practice, questions, new Date(2026, 5, 10, 12)).map(
        (item) => item.id,
      ),
    ).toEqual(["unseen"]);
    expect(
      practiceQueue(progress, practice, questions, new Date(2026, 5, 11, 12)).map(
        (item) => item.id,
      ),
    ).toEqual(["hard", "unseen"]);
  });

  it("counts dashboard due answers from compact attempt ids", () => {
    const progress: ProgressState = {
      version: 1,
      lessons: {
        [lessons[0].id]: {
          completedAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          scrollRatio: 1,
        },
      },
    };
    const attempts = {
      due: {
        questionId: `${lessons[0].id}#due`,
        rating: "again" as const,
        answeredAt: "2026-06-09T12:00:00.000Z",
        studyDate: "2026-06-09",
        updatedAt: "2026-06-09T12:00:00.000Z",
      },
      future: {
        questionId: `${lessons[0].id}#future`,
        rating: "hard" as const,
        answeredAt: "2026-06-10T12:00:00.000Z",
        studyDate: "2026-06-10",
        updatedAt: "2026-06-10T12:00:00.000Z",
      },
    };
    const summary = practiceOverviewSummary(
      progress,
      { ...emptyPractice(), attempts },
      new Date(2026, 5, 10, 12),
    );
    expect(summary.due).toBe(1);
    expect(summary.today).toBe(1);
  });
});
