import { CalendarBlank, Cards, ChartBar, CheckCircle, Fire, Stack } from "@phosphor-icons/react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getLastCompleted, overallProgress, readingHistory, sectionProgress } from "@/features/progress/metrics";
import { interviewQuestions } from "@/features/practice/questions";
import { lessonDateActivity, practiceSummary } from "@/features/practice/practice.metrics";
import { usePracticeState } from "@/features/practice/usePractice";
import { useProgressState } from "@/features/progress/useProgress";
import { orderedLessons, sections } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

type StatsTab = "reading" | "practice";

function readableDate(value: string, locale: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale.startsWith("ru") ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const progress = useProgressState();
  const practice = usePracticeState();
  const { sectionLabel, lessonLabel } = useContentLabels();
  const [activeTab, setActiveTab] = useState<StatsTab>("reading");
  const readingTabRef = useRef<HTMLButtonElement>(null);
  const practiceTabRef = useRef<HTMLButtonElement>(null);
  const overall = overallProgress(progress, orderedLessons);
  const practiceStats = useMemo(() => practiceSummary(progress, practice, interviewQuestions), [practice, progress]);
  const activity = useMemo(() => lessonDateActivity(progress, orderedLessons), [progress]);
  const readingRows = useMemo(() => readingHistory(progress, orderedLessons), [progress]);
  const activeDays = activity.filter((entry) => entry.count > 0).reverse();
  const last = getLastCompleted(progress, orderedLessons);
  const locale = i18n.language.startsWith("ru") ? "ru-RU" : "en-US";

  const focusTab = (tab: StatsTab) => {
    setActiveTab(tab);
    (tab === "reading" ? readingTabRef : practiceTabRef).current?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: StatsTab) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? "reading" : event.key === "End" ? "practice" : tab === "reading" ? "practice" : "reading";
      focusTab(next);
    }
  };

  return (
    <AppShell title={t("stats.title")} backTo="/profile">
      <p className="eyebrow">{t(activeTab === "reading" ? "stats.eyebrow" : "stats.practiceEyebrow")}</p>
      <h1 className="page-heading">{t(activeTab === "reading" ? "stats.heading" : "stats.practiceTitle")}</h1>

      <div className="stats-tabs" role="tablist" aria-label={t("stats.tabsLabel")}>
        <button
          ref={readingTabRef}
          className="stats-tab"
          type="button"
          role="tab"
          id="stats-tab-reading"
          aria-selected={activeTab === "reading"}
          aria-controls="stats-panel-reading"
          tabIndex={activeTab === "reading" ? 0 : -1}
          onClick={() => setActiveTab("reading")}
          onKeyDown={(event) => handleTabKeyDown(event, "reading")}
        >
          {t("stats.readingTab")}
        </button>
        <button
          ref={practiceTabRef}
          className="stats-tab"
          type="button"
          role="tab"
          id="stats-tab-practice"
          aria-selected={activeTab === "practice"}
          aria-controls="stats-panel-practice"
          tabIndex={activeTab === "practice" ? 0 : -1}
          onClick={() => setActiveTab("practice")}
          onKeyDown={(event) => handleTabKeyDown(event, "practice")}
        >
          {t("stats.practiceTab")}
        </button>
      </div>

      {activeTab === "reading" ? (
        <section className="stats-tabpanel" role="tabpanel" id="stats-panel-reading" aria-labelledby="stats-tab-reading" tabIndex={0}>
          <section className="stats-overview">
            <div className="stats-overview__item">
              <CheckCircle size={18} aria-hidden="true" />
              <span>{t("stats.completed")}</span>
              <strong>{overall.done}</strong>
            </div>
            <div className="stats-overview__item">
              <Stack size={18} aria-hidden="true" />
              <span>{t("stats.remaining")}</span>
              <strong>{overall.total - overall.done}</strong>
            </div>
          </section>

          <h2 className="section-heading">{t("stats.activityTitle")}</h2>
          <section className="stats-panel">
            <div className="stats-panel__heading">
              <span><CalendarBlank size={17} aria-hidden="true" /> {t("stats.last28Days")}</span>
              <strong>{activeDays.reduce((sum, entry) => sum + entry.count, 0)} {t("stats.lessonsShort")}</strong>
            </div>
            <div className="reading-activity" aria-label={t("stats.activityLabel")}>
              {activity.map((entry) => (
                <span
                  key={entry.date}
                  className={`reading-activity__cell reading-activity__cell--${Math.min(entry.count, 4)}`}
                  title={`${readableDate(entry.date, locale)}: ${entry.count}`}
                  aria-label={`${readableDate(entry.date, locale)}: ${entry.count}`}
                />
              ))}
            </div>
            <div className="reading-activity__legend">
              <span>{t("stats.less")}</span>
              <i className="reading-activity__cell reading-activity__cell--0" />
              <i className="reading-activity__cell reading-activity__cell--1" />
              <i className="reading-activity__cell reading-activity__cell--2" />
              <i className="reading-activity__cell reading-activity__cell--4" />
              <span>{t("stats.more")}</span>
            </div>
          </section>

          <h2 className="section-heading">{t("stats.historyTitle")}</h2>
          {readingRows.length > 0 ? (
            <div className="stats-table-wrap">
              <table className="stats-table">
                <caption className="visually-hidden">{t("stats.historyCaption")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("stats.tableDate")}</th>
                    <th scope="col">{t("stats.tableLessons")}</th>
                    <th scope="col">{t("stats.tableCumulative")}</th>
                  </tr>
                </thead>
                <tbody>
                  {readingRows.map((entry) => (
                    <tr key={entry.date}>
                      <th scope="row"><time dateTime={entry.date}>{readableDate(entry.date, locale)}</time></th>
                      <td>{entry.count}</td>
                      <td>{entry.cumulative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-note">{t("stats.noActivity")}</p>
          )}

          <h2 className="section-heading">{t("stats.bySection")}</h2>
          <ul className="stats-section-list">
            {sections.map((section) => {
              const tally = sectionProgress(progress, section);
              return (
                <li key={section.slug}>
                  <div className="stats-section-list__row">
                    <span>{sectionLabel(section)}</span>
                    <strong>{t("common.doneOfTotal", { done: tally.done, total: tally.total })}</strong>
                  </div>
                  <ProgressBar value={tally.ratio} />
                </li>
              );
            })}
          </ul>

          <div className="stats-last">
            <ChartBar size={17} aria-hidden="true" />
            <span>{t("stats.lastCompleted")}</span>
            {last ? <Link to={`/s/${last.section}/${last.folder}/${last.slug}`}>{lessonLabel(last)}</Link> : <em>{t("common.none")}</em>}
          </div>
        </section>
      ) : (
        <section className="stats-tabpanel" role="tabpanel" id="stats-panel-practice" aria-labelledby="stats-tab-practice" tabIndex={0}>
          <section className="stats-overview stats-practice-overview">
            <div className="stats-overview__item">
              <Fire size={18} aria-hidden="true" />
              <span>{t("stats.currentStreak")}</span>
              <strong>{practiceStats.currentStreak}</strong>
            </div>
            <div className="stats-overview__item">
              <Fire size={18} aria-hidden="true" />
              <span>{t("stats.bestStreak")}</span>
              <strong>{practiceStats.bestStreak}</strong>
            </div>
            <div className="stats-overview__item">
              <Cards size={18} aria-hidden="true" />
              <span>{t("stats.questionsLearned")}</span>
              <strong>{practiceStats.seen}</strong>
            </div>
            <div className="stats-overview__item">
              <CheckCircle size={18} aria-hidden="true" />
              <span>{t("stats.mastered")}</span>
              <strong>{practiceStats.mastered}</strong>
            </div>
          </section>

          <section className="stats-panel">
            <div className="stats-panel__heading">
              <span><CalendarBlank size={17} aria-hidden="true" /> {t("stats.practiceActivity")}</span>
              <strong>{practiceStats.today} {t("stats.answersToday")}</strong>
            </div>
            <div className="reading-activity" aria-label={t("stats.practiceActivityLabel")}>
              {practiceStats.activity.map((entry) => (
                <span
                  key={entry.date}
                  className={`reading-activity__cell reading-activity__cell--${Math.min(entry.count, 4)}`}
                  title={`${readableDate(entry.date, locale)}: ${entry.count}`}
                  aria-label={`${readableDate(entry.date, locale)}: ${entry.count}`}
                />
              ))}
            </div>
          </section>

          <h2 className="section-heading">{t("stats.weakTitle")}</h2>
          {practiceStats.weak.length > 0 ? (
            <ul className="stats-weak-list">
              {practiceStats.weak.map((question) => <li key={question.id}>{question.prompt}</li>)}
            </ul>
          ) : (
            <p className="empty-note">{t("stats.noWeak")}</p>
          )}
        </section>
      )}
    </AppShell>
  );
}
