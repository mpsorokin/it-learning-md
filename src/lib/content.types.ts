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
