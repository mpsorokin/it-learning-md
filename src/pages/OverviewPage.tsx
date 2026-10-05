import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ContentRow } from "@/components/ui/ContentRow";
import { ContinueCard } from "@/components/ui/ContinueCard";
import { TallyCard } from "@/components/ui/TallyCard";
import { sectionEntryPath } from "@/features/flows/flow";
import { practiceOverviewSummary } from "@/features/practice/practice.metrics";
import { usePracticeState } from "@/features/practice/usePractice";
import { getNextLesson, overallProgress, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { findFolder, lessonPath, orderedLessons, sections } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

export function OverviewPage() {
  const { t } = useTranslation();
  const progress = useProgressState();
  const practice = usePracticeState();
  const { sectionLabel, lessonLabel, folderLabel } = useContentLabels();

  const overall = overallProgress(progress, orderedLessons);
  const next = getNextLesson(progress, orderedLessons);
  const nextFolder = next && findFolder(next.section, next.folder);
  const practiceStats = practiceOverviewSummary(progress, practice);

  return (
    <AppShell>
      <p className="eyebrow">{t("overview.eyebrow")}</p>
      <h1 className="page-heading">{t("meta.title")}</h1>

      <TallyCard
        label={t("overview.overall")}
        value={t("common.doneOfTotal", { done: overall.done, total: overall.total })}
        ratio={overall.ratio}
      />

      <Link className="practice-summary-card" to="/practice">
        <div className="practice-summary-card__top">
          <span>{t("practice.today")}</span>
          <strong>
            {practiceStats.today} / {practice.dailyGoal}
          </strong>
        </div>
        <div className="practice-summary-card__bottom">
          <span>{t("practice.dueCount", { count: practiceStats.due })}</span>
          <strong>{t("practice.streak", { count: practiceStats.currentStreak })}</strong>
        </div>
      </Link>

      {next && nextFolder ? (
        <ContinueCard
          to={lessonPath(next)}
          eyebrow={overall.done === 0 ? t("overview.start") : t("overview.continue")}
          title={lessonLabel(next)}
          path={
            <>
              {sectionLabel(next.section)} · {folderLabel(nextFolder)}
            </>
          }
        />
      ) : (
        <p className="empty-note">
          {overall.total === 0 ? t("overview.noContent") : t("overview.allDone")}
        </p>
      )}

      <h2 className="section-heading">{t("overview.sections")}</h2>
      <ul className="content-list">
        {sections.map((section) => {
          const tally = sectionProgress(progress, section);
          return (
            <li key={section.slug}>
              <ContentRow
                to={sectionEntryPath(section)}
                title={sectionLabel(section)}
                count={t("common.doneOfTotal", { done: tally.done, total: tally.total })}
                ratio={tally.ratio}
                meta={t("library.folderCount", { count: section.folders.length })}
              />
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
