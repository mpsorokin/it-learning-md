import { CaretRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { folderProgress, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { findSection } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

/** The folders inside one section, each with its own done/total. */
export function SectionPage() {
  const { section: slug = "" } = useParams();
  const { t } = useTranslation();
  const progress = useProgressState();
  const { sectionLabel, folderLabel } = useContentLabels();

  const section = findSection(slug);
  if (!section) return <Navigate to="/not-found" replace />;

  const tally = sectionProgress(progress, section);

  return (
    <AppShell title={sectionLabel(section)} backTo="/library">
      <section className="stat-card">
        <div className="stat-card__row">
          <span className="stat-card__label">{t("section.progress")}</span>
          <span className="stat-card__value">{t("common.doneOfTotal", { done: tally.done, total: tally.total })}</span>
        </div>
        <ProgressBar value={tally.ratio} />
      </section>

      <ul className="content-list">
        {section.folders.map((folder) => {
          const folderTally = folderProgress(progress, folder);
          return (
            <li key={folder.id}>
              <Link className="content-row" to={`/s/${section.slug}/${folder.slug}`}>
                <div className="content-row__head">
                  <strong>{folderLabel(folder)}</strong>
                  <span className="content-row__count">
                    {t("common.doneOfTotal", { done: folderTally.done, total: folderTally.total })}
                  </span>
                </div>
                <ProgressBar value={folderTally.ratio} />
                <span className="content-row__meta">{t("library.lessonCount", { count: folder.lessons.length })}</span>
                <CaretRight className="content-row__caret" size={15} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
