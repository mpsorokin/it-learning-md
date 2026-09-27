/**
 * The content tree is three levels deep and no deeper: section → folder →
 * lesson. Kept separate from `content.ts` because that module runs
 * `import.meta.glob`, which only exists inside the bundler.
 */

export interface Lesson {
  /** `section/folder/slug` — stable across renames of the title. */
  id: string;
  section: string;
  folder: string;
  slug: string;
  title: string;
  order: number;
  /** Source path for the lazy Vite glob, not a URL. */
  sourcePath: string;
  questionCount: number;
}

export interface SearchIndexEntry {
  lessonId: string;
  text: string;
}

export interface InterviewQuestionMeta {
  id: string;
  lessonId: string;
  section: string;
  folder: string;
  prompt: string;
  promptBody: string;
  hasAnswer: boolean;
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
