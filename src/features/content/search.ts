import type { SearchIndexEntry } from "@/lib/content.types";
import { normalizeSearchText } from "@/lib/contentParsing";
import { findLessonById } from "@/lib/content";

export interface LessonSearchResult {
  lessonId: string;
  snippet: string;
  score: number;
}

export async function loadSearchIndex(): Promise<SearchIndexEntry[]> {
  const module = await import("virtual:ittheory/search-index");
  return module.loadSearchEntries();
}

function makeSnippet(text: string, tokens: string[]): string {
  const normalized = normalizeSearchText(text);
  const positions = tokens.map((token) => normalized.indexOf(token)).filter((position) => position >= 0);
  const hit = positions.length ? Math.min(...positions) : 0;
  let start = Math.max(0, hit - 65);
  let end = Math.min(text.length, start + 190);
  if (start > 0) {
    const boundary = text.indexOf(" ", start);
    if (boundary >= 0 && boundary < hit) start = boundary + 1;
  }
  if (end < text.length) {
    const boundary = text.lastIndexOf(" ", end);
    if (boundary > hit) end = boundary;
  }
  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
}

export function searchLessons(index: SearchIndexEntry[], query: string, limit = 50): LessonSearchResult[] {
  const tokens = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  return index.flatMap((entry) => {
    const normalized = normalizeSearchText(entry.text);
    if (!tokens.every((token) => normalized.includes(token))) return [];
    const lesson = findLessonById(entry.lessonId);
    if (!lesson) return [];
    const normalizedTitle = normalizeSearchText(lesson.title);
    const score = tokens.reduce((sum, token) => sum + (normalizedTitle.includes(token) ? 10 : 0), 0) +
      (normalizedTitle.includes(tokens.join(" ")) ? 5 : 0);
    return [{ lessonId: entry.lessonId, snippet: makeSnippet(entry.text, tokens), score }];
  }).sort((a, b) => b.score - a.score || a.lessonId.localeCompare(b.lessonId)).slice(0, limit);
}
