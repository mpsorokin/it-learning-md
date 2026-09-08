import { ArrowRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ContentRow } from "@/components/ui/ContentRow";
import { TallyCard } from "@/components/ui/TallyCard";
import { getNextLesson, overallProgress, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { interviewQuestions } from "@/features/practice/questions";
import { practiceSummary } from "@/features/practice/practice.metrics";
import { usePracticeState } from "@/features/practice/usePractice";
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
  const practiceStats = practiceSummary(progress, practice, interviewQuestions);

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
          <strong>{practiceStats.today} / {practice.dailyGoal}</strong>
        </div>
        <div className="practice-summary-card__bottom">
          <span>{t("practice.dueCount", { count: practiceStats.due })}</span>
          <strong>{t("practice.streak", { count: practiceStats.currentStreak })}</strong>
        </div>
      </Link>

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
              <ContentRow
                to={`/s/${section.slug}`}
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
