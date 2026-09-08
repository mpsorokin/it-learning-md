import { Check } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { TallyCard } from "@/components/ui/TallyCard";
import { folderProgress, isCompleted } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { findFolder, lessonPath } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

/** The lessons inside one folder — a flat, ticked list. */
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
          return (
            <li key={lesson.id}>
              <Link className={`lesson-row ${done ? "lesson-row--done" : ""}`} to={lessonPath(lesson)}>
                <span className="lesson-row__mark" aria-hidden="true">
                  {done ? <Check size={13} weight="bold" /> : String(index + 1).padStart(2, "0")}
                </span>
                <span className="lesson-row__title">{lessonLabel(lesson)}</span>
                {done && <span className="visually-hidden">{t("lesson.completed")}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
