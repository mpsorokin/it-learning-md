/**
 * The content tree is three levels deep and no deeper: section → folder →
 * lesson. Kept separate from `content.ts` because that module runs
 * `import.meta.glob`, which only exists inside the bundler — the pure logic
 * that reads these shapes has to stay importable from plain Node tests.
 */

export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export interface LessonMetadata {
  section: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  tags: string[];
  prerequisites: string[];
}

export interface Lesson {
  /** `section/folder/slug` — stable across renames of the title. */
  id: string;
  section: string;
  folder: string;
  slug: string;
  title: string;
  /** Optional per-locale title; falls back to `title`. */
  titleRu?: string;
  order: number;
  metadata: LessonMetadata;
  body: string;
}

export interface Folder {
  /** `section/folder`. */
  id: string;
  section: string;
  slug: string;
  lessons: Lesson[];
}

export interface Section {
  slug: string;
  folders: Folder[];
  lessons: Lesson[];
}
