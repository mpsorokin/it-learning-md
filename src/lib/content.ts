import { frontmatterList, frontmatterString, humanizeSlug, parseFrontmatter, resolveOrder } from "@/lib/frontmatter";
import type { Folder, Lesson, LessonDifficulty, Section } from "@/lib/content.types";

/**
 * The whole catalogue is discovered from the filesystem at build time: dropping
 * a `.md` file into `src/content/<section>/<folder>/` is the only step needed to
 * publish a lesson. No index file to update, nothing to regenerate.
 *
 * The glob is eager, so lesson bodies are part of the main bundle. That is the
 * price of the zero-ceremony authoring above and it is fine at this size; past
 * roughly a megabyte of markdown, switch the bodies to a second lazy glob and
 * keep only the frontmatter here.
 */
const files = import.meta.glob("../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const PATH = /\/content\/([^/]+)\/([^/]+)\/([^/]+)\.md$/;

function buildLessons(): Lesson[] {
  const lessons: Lesson[] = [];

  for (const [path, source] of Object.entries(files)) {
    const match = PATH.exec(path);
    if (!match) {
      // A markdown file at the wrong depth would otherwise vanish silently.
      console.warn(`Ignoring "${path}": lessons live at content/<section>/<folder>/<slug>.md`);
      continue;
    }

    const [, section, folder, fileSlug] = match;
    const { data, body } = parseFrontmatter(source);
    const slug = frontmatterString(data.slug) || fileSlug;
    const difficulty = frontmatterString(data.difficulty) as LessonDifficulty | undefined;
    lessons.push({
      id: `${section}/${folder}/${slug}`,
      section,
      folder,
      slug,
      title: frontmatterString(data.title) || humanizeSlug(slug),
      titleRu: frontmatterString(data.titleRu),
      order: resolveOrder(frontmatterString(data.order), fileSlug),
      metadata: {
        section: frontmatterString(data.section) || humanizeSlug(folder),
        difficulty: difficulty || "beginner",
        estimatedMinutes: Number.parseInt(frontmatterString(data.estimatedMinutes) || "0", 10),
        tags: frontmatterList(data.tags),
        prerequisites: frontmatterList(data.prerequisites),
      },
      body,
    });
  }

  return lessons;
}

/** Order first, then slug — so files without an order still sort predictably. */
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
        // A folder inherits the order of its first lesson, so `01-…` in the
        // earliest file is enough to place the folder itself.
        .sort((a, b) => (a.lessons[0]?.order ?? 0) - (b.lessons[0]?.order ?? 0) || a.slug.localeCompare(b.slug));

      return { slug: section, folders, lessons: folders.flatMap((folder) => folder.lessons) };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const allLessons: Lesson[] = buildLessons();
export const sections: Section[] = buildSections(allLessons);

/** Reading order across the whole catalogue, used by "continue" and prev/next. */
export const orderedLessons: Lesson[] = sections.flatMap((section) => section.lessons);

const sectionsBySlug = new Map(sections.map((section) => [section.slug, section]));
const foldersById = new Map(sections.flatMap((section) => section.folders).map((folder) => [folder.id, folder]));
const lessonsById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));

export const findSection = (slug: string): Section | undefined => sectionsBySlug.get(slug);
export const findFolder = (section: string, folder: string): Folder | undefined => foldersById.get(`${section}/${folder}`);
export const findLesson = (section: string, folder: string, slug: string): Lesson | undefined =>
  lessonsById.get(`${section}/${folder}/${slug}`);

/** `{ section, folder, lesson }` params for the route that renders `lesson`. */
export const lessonPath = (lesson: Lesson): string =>
  `/s/${lesson.section}/${lesson.folder}/${lesson.slug}`;
