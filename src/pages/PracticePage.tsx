import { ArrowCounterClockwise, Check, Flame, TrendUp, Waveform } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { MarkdownViewer } from "@/features/reading/MarkdownViewer";
import { useProgressState } from "@/features/progress/useProgress";
import { interviewQuestions, interviewQuestionsById } from "@/features/practice/questions";
import { practiceQueue, practiceSummary } from "@/features/practice/practice.metrics";
import { usePracticeActions, usePracticeState } from "@/features/practice/usePractice";
import type { PracticeRating } from "@/features/practice/practice.types";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { findFolder } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

export function PracticePage() {
  const { t, i18n } = useTranslation();
  const { sectionLabel, folderLabel } = useContentLabels();
  const progress = useProgressState();
  const practice = usePracticeState();
  const { recordAttempt } = usePracticeActions();
  const initialQueue = useMemo(
    () => practiceQueue(progress, practice, interviewQuestions),
    [practice, progress],
  );
  const [sessionIds, setSessionIds] = useState<string[]>(() =>
    initialQueue.slice(0, practice.dailyGoal).map((question) => question.id),
  );
  const [sessionTarget, setSessionTarget] = useState(() => Math.min(practice.dailyGoal, initialQueue.length));
  const [revealed, setRevealed] = useState(false);
  const summary = useMemo(
    () => practiceSummary(progress, practice, interviewQuestions),
    [practice, progress],
  );
  const current = sessionIds.length > 0 ? interviewQuestionsById.get(sessionIds[0]) : undefined;
  const currentFolder = current ? findFolder(current.section, current.folder) : undefined;
  const position = sessionTarget - sessionIds.length + 1;
  const locale = i18n.language.startsWith("ru") ? "ru-RU" : "en-US";

  const rate = (rating: PracticeRating) => {
    if (!current) return;
    recordAttempt(current.id, rating);
    setRevealed(false);
    setSessionIds((ids) => {
      const [head, ...rest] = ids;
      return rating === "again" && head ? [...rest, head] : rest;
    });
  };

  const restart = () => {
    const next = practiceQueue(progress, practice, interviewQuestions).slice(0, practice.dailyGoal);
    setSessionIds(next.map((question) => question.id));
    setSessionTarget(next.length);
    setRevealed(false);
  };

  return (
    <AppShell
      title={t("practice.title")}
      backTo="/"
      className="practice-shell"
      right={
        <span className="practice-streak" title={t("practice.streakLabel")}>
          <Flame size={19} weight="regular" aria-hidden="true" />
          <span>{summary.currentStreak}</span>
        </span>
      }
    >
      {current ? (
        <>
          <div className="practice-session-meta">
            <span>{t("practice.position", { position, total: sessionTarget })}</span>
            <span className="practice-session-meta__streak">
              <Flame size={14} aria-hidden="true" /> {t("practice.streak", { count: summary.currentStreak })}
            </span>
          </div>
          <div className="practice-session-progress" aria-hidden="true">
            <span style={{ width: `${(Math.max(0, position - 1) / Math.max(1, sessionTarget)) * 100}%` }} />
          </div>

          <article className={`practice-question-card ${revealed ? "practice-question-card--revealed" : ""}`}>
            {!revealed ? (
              <>
                <p className="eyebrow">{t("practice.questionLabel")}</p>
                <p className="practice-question-card__source">
                  {sectionLabel(current.section)} · {currentFolder ? folderLabel(currentFolder) : current.folder}
                </p>
                <h2>{current.prompt}</h2>
                <p className="practice-question-card__hint">{t("practice.answerAloud")}</p>
              </>
            ) : (
              <>
                <p className="eyebrow">{t("practice.answerLabel")}</p>
                <h2>{current.prompt}</h2>
                <div className="practice-answer">
                  <MarkdownViewer body={current.answer} />
                </div>
              </>
            )}
          </article>

          {!revealed ? (
            <button className="practice-reveal-button" type="button" onClick={() => setRevealed(true)}>
              {t("practice.showAnswer")}
            </button>
          ) : (
            <div className="practice-rating-grid" aria-label={t("practice.rateLabel")}>
              <button type="button" className="practice-rating" onClick={() => rate("again")}>
                <ArrowCounterClockwise size={22} aria-hidden="true" />
                <span>{t("practice.again")}</span>
              </button>
              <button type="button" className="practice-rating" onClick={() => rate("hard")}>
                <Waveform size={22} aria-hidden="true" />
                <span>{t("practice.hard")}</span>
              </button>
              <button type="button" className="practice-rating practice-rating--known" onClick={() => rate("known")}>
                <Check size={22} weight="bold" aria-hidden="true" />
                <span>{t("practice.known")}</span>
              </button>
            </div>
          )}
        </>
      ) : sessionTarget > 0 || summary.today >= practice.dailyGoal ? (
        <section className="practice-complete">
          <ProgressRing value={1} label={t("practice.completeTitle")} />
          <p className="eyebrow">{t("practice.sessionComplete")}</p>
          <h2>{t("practice.completeTitle")}</h2>
          <p>{t("practice.completeDescription", { count: summary.dueTomorrow })}</p>
          <button className="primary-button" type="button" onClick={restart}>
            <TrendUp size={16} aria-hidden="true" />
            {t("practice.continue")}
          </button>
          <Link className="practice-secondary-link" to="/profile">
            {t("practice.viewProgress")}
          </Link>
        </section>
      ) : (
        <section className="practice-empty">
          <span className="practice-empty__icon"><Waveform size={24} aria-hidden="true" /></span>
          <p className="eyebrow">{t("practice.emptyEyebrow")}</p>
          <h2>{t("practice.emptyTitle")}</h2>
          <p>{t("practice.emptyDescription")}</p>
          <Link className="primary-button" to="/library">{t("practice.openLibrary")}</Link>
        </section>
      )}
      <p className="practice-date-note">
        {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date())}
      </p>
    </AppShell>
  );
}
