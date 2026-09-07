import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { humanizeSlug } from "@/lib/frontmatter";
import type { Folder, Lesson, Section } from "@/lib/content.types";

/**
 * Section and folder names come from the interface locale under
 * `content.<section>.title` / `content.<section>.<folder>.title`, falling back
 * to the folder name itself. That way a new folder shows up immediately with a
 * readable name, and translating it later is purely additive — a missing key is
 * never a broken screen.
 *
 * Lesson titles live in the markdown instead, since they belong to the content.
 */
export function useContentLabels() {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    // The typed `t` only accepts literal keys; these are assembled at runtime
    // and guarded by `exists`, so the cast is the whole point.
    const translate = (key: string) => (i18n.exists(key) ? (t as (key: string) => string)(key) : null);

    const sectionLabel = (section: Section | string) => {
      const slug = typeof section === "string" ? section : section.slug;
      return translate(`content.${slug}.title`) ?? humanizeSlug(slug);
    };

    const folderLabel = (folder: Folder) =>
      translate(`content.${folder.section}.${folder.slug}.title`) ?? humanizeSlug(folder.slug);

    const lessonLabel = (lesson: Lesson) =>
      (i18n.language === "ru" && lesson.titleRu) || lesson.title;

    return { sectionLabel, folderLabel, lessonLabel };
  }, [t, i18n]);
}
