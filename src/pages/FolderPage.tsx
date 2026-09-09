import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LessonRow } from "@/components/ui/LessonRow";
import { TallyCard } from "@/components/ui/TallyCard";
import { folderProgress, isCompleted, lessonScrollRatio } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { findFolder, lessonPath } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

/** The lessons inside one folder — one card per lesson with reading progress. */
export function FolderPage() {
  const { section = "", folder: slug = "" } = useParams();
  const { t } = useTranslation();
  const progress = useProgressState();
  const { folderLabel, lessonLabel } = useContentLabels();

  const folder = findFolder(section, slug);
  if (!folder) return <Navigate to="/not-found" replace />;

  const tally = folderProgress(progress, folder);

  return (
    <AppShell title={folderLabel(folder)} backTo={`/s/${section}`}>
      <TallyCard
        label={t("section.progress")}
        value={t("common.doneOfTotal", { done: tally.done, total: tally.total })}
        ratio={tally.ratio}
      />

      <ol className="lesson-list">
        {folder.lessons.map((lesson, index) => {
          const done = isCompleted(progress, lesson.id);
          const ratio = lessonScrollRatio(progress, lesson.id);
          return (
            <li key={lesson.id}>
              <LessonRow
                to={lessonPath(lesson)}
                title={lessonLabel(lesson)}
                index={index}
                done={done}
                ratio={ratio}
                progressLabel={t("lesson.readingProgress", { title: lessonLabel(lesson) })}
                completedLabel={t("lesson.completed")}
              />
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
