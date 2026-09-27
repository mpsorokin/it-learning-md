import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ContentRow } from "@/components/ui/ContentRow";
import { LessonRow } from "@/components/ui/LessonRow";
import { isCompleted, lessonScrollRatio, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { useStudyState } from "@/features/study/useStudy";
import { lessonPath, orderedLessons, sections } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";
import { fullstackInterviewFlow } from "@/features/flows/flow";

/** Every section, with its folder count and progress. */
export function LibraryPage() {
  const { t } = useTranslation();
  const progress = useProgressState();
  const study = useStudyState();
  const { sectionLabel } = useContentLabels();
  const [showSaved, setShowSaved] = useState(false);
  const savedLessons = orderedLessons.filter((lesson) => study.lessons[lesson.id]?.bookmarked);

  return (
    <AppShell
      title={t("nav.library")}
      right={<Link className="icon-button" to="/search" aria-label={t("search.open")}><MagnifyingGlass size={19} aria-hidden="true" /></Link>}
    >
      <div className="library-filters" role="group" aria-label={t("library.filters")}>
        <button type="button" className={!showSaved ? "active" : ""} aria-pressed={!showSaved} onClick={() => setShowSaved(false)}>{t("library.allContent")}</button>
        <button type="button" className={showSaved ? "active" : ""} aria-pressed={showSaved} onClick={() => setShowSaved(true)}>{t("study.bookmarks")}</button>
      </div>
      {showSaved ? (
        savedLessons.length > 0 ? (
          <ol className="lesson-list">
            {savedLessons.map((lesson, index) => (
              <li key={lesson.id}>
                <LessonRow
                  to={lessonPath(lesson)}
                  title={lesson.title}
                  index={index}
                  done={isCompleted(progress, lesson.id)}
                  ratio={lessonScrollRatio(progress, lesson.id)}
                  progressLabel={t("lesson.readingProgress", { title: lesson.title })}
                  completedLabel={t("lesson.completed")}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-note">{t("study.noBookmarks")}</p>
        )
      ) : sections.length === 0 ? (
        <p className="empty-note">{t("overview.noContent")}</p>
      ) : (
        <ul className="content-list">
          {sections.map((section) => {
            const tally = sectionProgress(progress, section);
            return (
              <li key={section.slug}>
                <ContentRow
                  to={section.slug === fullstackInterviewFlow.section ? `/flows/${fullstackInterviewFlow.id}` : `/s/${section.slug}`}
                  title={sectionLabel(section)}
                  count={t("common.doneOfTotal", { done: tally.done, total: tally.total })}
                  ratio={tally.ratio}
                  meta={section.slug === fullstackInterviewFlow.section
                    ? t("flows.topicCount", { count: section.folders.length })
                    : t("library.folderCount", { count: section.folders.length })}
                />
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
