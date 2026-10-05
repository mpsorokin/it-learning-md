import { describe, expect, it } from "vitest";
import {
  fullstackInterviewFlow,
  orderedFlowLessons,
  orderedLessonNeighbours,
  resolveFlow,
} from "@/features/flows/flow";
import { interviewQuestions } from "@/features/practice/questions";
import { getNextLesson, overallProgress } from "@/features/progress/metrics";
import { emptyProgress } from "@/features/progress/progress.types";
import { scrollTopForRatio } from "@/features/reading/useReadingScroll";
import { findFolder, loadLessonBody } from "@/lib/content";
import { parseInterviewQuestions } from "@/lib/contentParsing";

describe("full-stack interview flow", () => {
  it("exposes every answered flow prompt to the practice queue", () => {
    expect(interviewQuestions.every((question) => question.hasAnswer === true)).toBe(true);
    expect(
      interviewQuestions.filter((question) => question.section === fullstackInterviewFlow.section),
    ).toHaveLength(882);
  });

  it("resolves all 42 topics in the configured phase order", () => {
    const flow = resolveFlow(fullstackInterviewFlow.id);
    expect(flow).toBeDefined();
    expect(flow?.groups).toHaveLength(7);
    expect(flow?.topics).toHaveLength(42);
    expect(flow?.topics.map(({ folder }) => folder.slug)).toEqual(
      fullstackInterviewFlow.groups.flatMap((group) => group.folderSlugs),
    );
    expect(new Set(flow?.topics.map(({ folder }) => folder.id)).size).toBe(42);
  });

  it("keeps every file at 1–10 stable prompts with separately parsed answer fields", async () => {
    const lessons = orderedFlowLessons(fullstackInterviewFlow);
    const allQuestions = [];
    for (const lesson of lessons) {
      const body = await loadLessonBody(lesson.id);
      const questions = parseInterviewQuestions(lesson.id, body);
      expect(questions).toHaveLength(lesson.questionCount);
      expect(questions.length).toBeGreaterThanOrEqual(1);
      expect(questions.length).toBeLessThanOrEqual(10);
      expect(
        questions.every(
          (question) =>
            question.hasAnswerMarker &&
            question.hasExplicitId &&
            question.hasAnswer &&
            question.answer.trim().length > 0,
        ),
      ).toBe(true);
      allQuestions.push(...questions);
    }

    const ids = allQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    const stableIds = allQuestions.map((question) =>
      question.id.slice(question.id.lastIndexOf("#") + 1),
    );
    expect(new Set(stableIds).size).toBe(stableIds.length);
    const firstTopic = findFolder(fullstackInterviewFlow.section, "01-js-runtime");
    expect(firstTopic?.lessons.map((lesson) => lesson.questionCount)).toEqual([
      5, 4, 9, 4, 9, 10, 3, 6, 3, 6, 5,
    ]);
    expect(allQuestions).toHaveLength(882);
  });

  it("weights flow progress by subtopic and resumes the latest open one", () => {
    const lessons = orderedFlowLessons(fullstackInterviewFlow);
    const now = new Date().toISOString();
    const nextTime = new Date(Date.now() + 1000).toISOString();
    const progress = {
      ...emptyProgress(),
      lessons: {
        [lessons[0].id]: { completedAt: now, updatedAt: now, scrollRatio: 1 },
        [lessons[1].id]: { completedAt: null, updatedAt: now, scrollRatio: 0.2 },
        [lessons[2].id]: { completedAt: null, updatedAt: nextTime, scrollRatio: 0.5 },
      },
    };

    expect(overallProgress(progress, lessons)).toMatchObject({ done: 1, total: lessons.length });
    expect(getNextLesson(progress, lessons)?.id).toBe(lessons[2].id);
  });

  it("moves to the next topic at a topic boundary", () => {
    const lessons = orderedFlowLessons(fullstackInterviewFlow);
    const firstTopicLast = [...lessons]
      .reverse()
      .find((lesson) => lesson.folder === "01-js-runtime");
    const secondTopicFirst = lessons.find(
      (lesson) => lesson.folder === "02-js-objects-prototypes-oop",
    );
    expect(firstTopicLast).toBeDefined();
    expect(secondTopicFirst).toBeDefined();
    expect(orderedLessonNeighbours(lessons, firstTopicLast!.id).next?.id).toBe(
      secondTopicFirst!.id,
    );
    expect(orderedLessonNeighbours(lessons, secondTopicFirst!.id).previous?.id).toBe(
      firstTopicLast!.id,
    );
  });

  it("uses saved scroll ratios to restore the reader position", () => {
    expect(scrollTopForRatio(1200, 200, 0.5)).toBe(500);
    expect(scrollTopForRatio(200, 300, 0.7)).toBe(0);
  });

  it("removing a completion mark restores the in-progress state and its position", () => {
    const lessons = orderedFlowLessons(fullstackInterviewFlow);
    const lesson = lessons[0];
    const doneAt = new Date().toISOString();
    const completedProgress = {
      ...emptyProgress(),
      lessons: { [lesson.id]: { completedAt: doneAt, updatedAt: doneAt, scrollRatio: 1 } },
    };
    expect(overallProgress(completedProgress, lessons).done).toBe(1);

    const resetAt = new Date(Date.now() + 1000).toISOString();
    const resetProgress = {
      ...completedProgress,
      lessons: { [lesson.id]: { completedAt: null, updatedAt: resetAt, scrollRatio: 0.4 } },
    };
    expect(overallProgress(resetProgress, lessons).done).toBe(0);
    expect(getNextLesson(resetProgress, lessons)?.id).toBe(lesson.id);
  });
});
