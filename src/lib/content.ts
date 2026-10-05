import { lessons as catalog } from "virtual:ittheory/catalog";
import type { Folder, Lesson, Section } from "@/lib/content.types";

/**
 * The Vite plugin indexes small lesson metadata at build time. The bodies stay
 * in separate chunks and are fetched only by a reader, search or practice view.
 */
const bodyLoaders = import.meta.glob("../content/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const byOrder = <T extends { order: number; slug: string }>(a: T, b: T): number =>
  a.order - b.order || a.slug.localeCompare(b.slug);

function buildSections(lessons: Lesson[]): Section[] {
  const sections = new Map<string, Map<string, Lesson[]>>();

  for (const lesson of lessons) {
    let folders = sections.get(lesson.section);
    if (!folders) sections.set(lesson.section, (folders = new Map()));
    const bucket = folders.get(lesson.folder);
    if (bucket) bucket.push(lesson);
    else folders.set(lesson.folder, [lesson]);
  }

  return [...sections.entries()]
    .map(([section, folderMap]) => {
      const folders: Folder[] = [...folderMap.entries()]
        .map(([slug, folderLessons]) => ({
          id: `${section}/${slug}`,
          section,
          slug,
          lessons: [...folderLessons].sort(byOrder),
        }))
        .sort(
          (a, b) =>
            (a.lessons[0]?.order ?? 0) - (b.lessons[0]?.order ?? 0) || a.slug.localeCompare(b.slug),
        );

      return { slug: section, folders, lessons: folders.flatMap((folder) => folder.lessons) };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const allLessons = catalog as Lesson[];
export const sections: Section[] = buildSections(allLessons);

/** Reading order across the whole catalogue, used by "continue" and prev/next. */
export const orderedLessons: Lesson[] = sections.flatMap((section) => section.lessons);

const sectionsBySlug = new Map(sections.map((section) => [section.slug, section]));
const foldersById = new Map(
  sections.flatMap((section) => section.folders).map((folder) => [folder.id, folder]),
);
const lessonsById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));

export const findSection = (slug: string): Section | undefined => sectionsBySlug.get(slug);
export const findFolder = (section: string, folder: string): Folder | undefined =>
  foldersById.get(`${section}/${folder}`);
export const findLesson = (section: string, folder: string, slug: string): Lesson | undefined =>
  lessonsById.get(`${section}/${folder}/${slug}`);
export const findLessonById = (id: string): Lesson | undefined => lessonsById.get(id);

export async function loadLessonBody(lessonId: string): Promise<string> {
  const lesson = lessonsById.get(lessonId);
  if (!lesson) throw new Error(`Unknown lesson: ${lessonId}`);
  const loader = bodyLoaders[lesson.sourcePath];
  if (!loader) throw new Error(`Missing lesson body: ${lesson.sourcePath}`);
  return loader();
}

/** Route paths live here so a screen never spells out `/s/...` on its own. */
export const sectionPath = (section: string): string => `/s/${section}`;
export const folderPath = (folder: Folder): string => `/s/${folder.section}/${folder.slug}`;

/** `{ section, folder, lesson }` params for the route that renders `lesson`. */
export const lessonPath = (lesson: Lesson): string =>
  `/s/${lesson.section}/${lesson.folder}/${lesson.slug}`;
