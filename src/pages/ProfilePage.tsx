import { CheckCircle, Gear, Stack } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TallyRow } from "@/components/ui/TallyCard";
import { getLastCompleted, overallProgress, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { lessonPath, orderedLessons, sections } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

export function ProfilePage() {
  const { t } = useTranslation();
  const progress = useProgressState();
  const { sectionLabel, lessonLabel } = useContentLabels();

  const overall = overallProgress(progress, orderedLessons);
  const last = getLastCompleted(progress, orderedLessons);

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
      </div>
    </AppShell>
  );
}
