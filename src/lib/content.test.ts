import { describe, expect, it } from "vitest";
import { loadSearchIndex, searchLessons } from "@/features/content/search";
import { interviewQuestions } from "@/features/practice/questions";
import { loadLessonBody, orderedLessons } from "@/lib/content";

describe("generated lesson catalogue", () => {
  it("keeps all Python lessons in the practice pool", () => {
    const pythonLessons = orderedLessons.filter((lesson) => lesson.section === "python");
    expect(pythonLessons).toHaveLength(14);
    for (const lesson of pythonLessons) {
      expect(interviewQuestions.filter((question) => question.lessonId === lesson.id).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("loads a lesson body only by its stable catalogue id", async () => {
    const body = await loadLessonBody("typescript/01-foundation/type-inference");
    expect(body).toContain("# Type Inference");
  });

  it("finds Russian text and code from the lazily loaded search index", async () => {
    const index = await loadSearchIndex();
    expect(searchLessons(index, "contextual typing").some((result) => result.lessonId === "typescript/01-foundation/type-inference")).toBe(true);
    expect(searchLessons(index, "hashability").some((result) => result.lessonId === "python/02-collectiions-and-data-structures/hash-frozen-hash-hashability")).toBe(true);
    expect(searchLessons(index, "zzzxxyyq123nonexistent")).toEqual([]);
  });
});
