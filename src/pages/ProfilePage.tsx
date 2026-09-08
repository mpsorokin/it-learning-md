import { Cards, ChartBar, CheckCircle, Fire, Gear, Stack } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TallyRow } from "@/components/ui/TallyCard";
import { getLastCompleted, overallProgress, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { interviewQuestions } from "@/features/practice/questions";
import { practiceSummary } from "@/features/practice/practice.metrics";
import { usePracticeState } from "@/features/practice/usePractice";
import { lessonPath, orderedLessons, sections } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

export function ProfilePage() {
  const { t } = useTranslation();
  const progress = useProgressState();
  const practice = usePracticeState();
  const { sectionLabel, lessonLabel } = useContentLabels();

  const overall = overallProgress(progress, orderedLessons);
  const last = getLastCompleted(progress, orderedLessons);
  const practiceStats = practiceSummary(progress, practice, interviewQuestions);

  return (
    <AppShell
      title={t("nav.profile")}
      right={
        <Link className="icon-button" to="/settings" aria-label={t("common.settings")}>
          <Gear size={20} aria-hidden="true" />
        </Link>
      }
    >
      <section className="profile-hero">
        <ProgressRing value={overall.ratio} label={t("overview.overall")} />
        <div>
          <p className="eyebrow">{t("overview.overall")}</p>
          <strong>{t("common.doneOfTotal", { done: overall.done, total: overall.total })}</strong>
          <span>{t("profile.lessonsCompleted", { count: overall.done })}</span>
        </div>
      </section>

      <ul className="stat-rows">
        <li>
          <CheckCircle size={19} aria-hidden="true" />
          <span>{t("profile.completed")}</span>
          <strong>{overall.done}</strong>
        </li>
        <li>
          <Stack size={19} aria-hidden="true" />
          <span>{t("profile.remaining")}</span>
          <strong>{overall.total - overall.done}</strong>
        </li>
      </ul>

      <h2 className="section-heading">{t("profile.interviewReadiness")}</h2>
      <Link className="practice-profile-card" to="/practice">
        <div className="practice-profile-card__header">
          <span><Cards size={18} aria-hidden="true" /> {t("profile.questionsLearned")}</span>
          <strong>{practiceStats.mastered} / {interviewQuestions.filter((question) => Boolean(progress.lessons[question.lessonId])).length}</strong>
        </div>
        <div className="practice-profile-card__stats">
          <span><Fire size={16} aria-hidden="true" /> {t("profile.currentStreak")}</span>
          <b>{practiceStats.currentStreak}</b>
          <span>{t("profile.bestStreak")}</span>
          <b>{practiceStats.bestStreak}</b>
          <span>{t("profile.toReview")}</span>
          <b>{practiceStats.due}</b>
        </div>
      </Link>

      <h2 className="section-heading">{t("profile.bySection")}</h2>
      <ul className="stat-list">
        {sections.map((section) => {
          const tally = sectionProgress(progress, section);
          return (
            <li key={section.slug}>
              <TallyRow
                label={sectionLabel(section)}
                value={t("common.doneOfTotal", { done: tally.done, total: tally.total })}
              />
              <ProgressBar value={tally.ratio} />
            </li>
          );
        })}
      </ul>

      <h2 className="section-heading">{t("profile.details")}</h2>
      <div className="detail-card">
        <div className="detail-card__row">
          <span>{t("profile.lastCompleted")}</span>
          {last ? <Link to={lessonPath(last)}>{lessonLabel(last)}</Link> : <em>{t("common.none")}</em>}
        </div>
        <Link className="detail-card__link" to="/stats">
          <ChartBar size={17} aria-hidden="true" />
          <span>{t("profile.readingStats")}</span>
        </Link>
      </div>
    </AppShell>
  );
}
