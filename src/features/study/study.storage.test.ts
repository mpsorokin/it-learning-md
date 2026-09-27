import { describe, expect, it, vi } from "vitest";
import { mergeStudyLessons, parseStudyState, MAX_NOTE_LENGTH } from "@/features/study/study.storage";
import { emptyStudy } from "@/features/study/study.types";
import { readStored } from "@/lib/storage";

describe("study storage", () => {
  it("accepts the current schema and backs up future schemas by returning null", () => {
    const data = { version: 1, lessons: { "typescript/topic/lesson": { note: "Review this", bookmarked: true, updatedAt: "2026-09-25T10:00:00.000Z", writerId: "tab-a" } } };
    expect(parseStudyState(data)?.lessons["typescript/topic/lesson"]?.bookmarked).toBe(true);
    expect(parseStudyState({ ...data, version: 2 })).toBeNull();
  });

  it("copies an unknown stored schema to the .bak key before it is replaced", () => {
    const key = "ittheory:study:v1";
    const raw = JSON.stringify({ version: 2, lessons: {} });
    const values = new Map([[key, raw]]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (name: string) => values.get(name) ?? null,
        setItem: (name: string, value: string) => values.set(name, value),
      },
    });
    try {
      expect(readStored(key, parseStudyState, emptyStudy)).toEqual(emptyStudy());
      expect(values.get(`${key}.bak`)).toBe(raw);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejects notes that exceed the UI limit", () => {
    const data = { version: 1, lessons: { x: { note: "x".repeat(MAX_NOTE_LENGTH + 1), bookmarked: false, updatedAt: "now", writerId: "tab-a" } } };
    expect(parseStudyState(data)?.lessons.x).toBeUndefined();
  });

  it("merges different lessons and chooses the newest same-lesson edit", () => {
    const first = { note: "old", bookmarked: false, updatedAt: "2026-01-01T00:00:00.000Z", writerId: "tab-a" };
    const second = { note: "new", bookmarked: true, updatedAt: "2026-01-02T00:00:00.000Z", writerId: "tab-b" };
    const merged = mergeStudyLessons({ a: first }, { a: second, b: first });
    expect(merged).toEqual({ a: second, b: first });
    expect(emptyStudy().version).toBe(1);
  });
});
