import { ArrowRight, CaretRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getNextLesson, overallProgress, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { lessonPath, orderedLessons, sections } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

export function OverviewPage() {
  const { t } = useTranslation();
  const progress = useProgressState();
  const { sectionLabel, lessonLabel, folderLabel } = useContentLabels();

  const overall = overallProgress(progress, orderedLessons);
  const next = getNextLesson(progress, orderedLessons);
  const nextFolder = next && sections.find((s) => s.slug === next.section)?.folders.find((f) => f.slug === next.folder);

  return (
    <AppShell>
      <p className="eyebrow">{t("overview.eyebrow")}</p>
      <h1 className="page-heading">{t("meta.title")}</h1>

      <section className="stat-card">
        <div className="stat-card__row">
          <span className="stat-card__label">{t("overview.overall")}</span>
          <span className="stat-card__value">{t("common.doneOfTotal", { done: overall.done, total: overall.total })}</span>
        </div>
        <ProgressBar value={overall.ratio} />
      </section>

      {next && nextFolder ? (
        <Link className="continue-card" to={lessonPath(next)}>
          <p className="eyebrow">{overall.done === 0 ? t("overview.start") : t("overview.continue")}</p>
          <strong>{lessonLabel(next)}</strong>
          <span className="continue-card__path">
            {sectionLabel(next.section)} · {folderLabel(nextFolder)}
          </span>
          <ArrowRight className="continue-card__arrow" size={18} aria-hidden="true" />
        </Link>
      ) : (
        <p className="empty-note">{overall.total === 0 ? t("overview.noContent") : t("overview.allDone")}</p>
      )}

      <h2 className="section-heading">{t("overview.sections")}</h2>
      <ul className="content-list">
        {sections.map((section) => {
          const tally = sectionProgress(progress, section);
          return (
            <li key={section.slug}>
              <Link className="content-row" to={`/s/${section.slug}`}>
                <div className="content-row__head">
                  <strong>{sectionLabel(section)}</strong>
                  <span className="content-row__count">
                    {t("common.doneOfTotal", { done: tally.done, total: tally.total })}
                  </span>
                </div>
                <ProgressBar value={tally.ratio} />
                <span className="content-row__meta">{t("library.folderCount", { count: section.folders.length })}</span>
                <CaretRight className="content-row__caret" size={15} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
