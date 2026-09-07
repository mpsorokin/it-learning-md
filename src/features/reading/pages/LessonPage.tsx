import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reading/MarkdownViewer";
import { useReaderTheme } from "@/features/reading/ReaderThemeProvider";
import { lessonNeighbours } from "@/features/progress/metrics";
import { useProgressActions } from "@/features/progress/useProgress";
import { findFolder, findLesson, lessonPath } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

export function LessonPage() {
  const { section = "", folder = "", lesson: slug = "" } = useParams();
  const { t } = useTranslation();
  const { theme } = useReaderTheme();
  const { lessonLabel, folderLabel } = useContentLabels();
  const { completeLesson, resetLesson, getProgressSnapshot } = useProgressActions();

  const lesson = findLesson(section, folder, slug);
  const parent = findFolder(section, folder);

  /**
   * Mirrors the store rather than subscribing to it: the button has to flip the
   * instant it is pressed, and reading through the state context would re-render
   * the whole reader — markdown included — on every tick anywhere in the app.
   */
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (lesson) setCompleted(Boolean(getProgressSnapshot().lessons[lesson.id]));
  }, [lesson, getProgressSnapshot]);

  // The scroll container is a new element per lesson only in spirit — React
  // reuses it across a prev/next navigation, so the reset has to be explicit.
  useEffect(() => {
    document.querySelector(".reader-scroll")?.scrollTo({ top: 0 });
  }, [slug, folder, section]);

  if (!lesson || !parent) return <Navigate to="/not-found" replace />;

  const { previous, next } = lessonNeighbours(parent, lesson);
  const position = parent.lessons.indexOf(lesson) + 1;

  const handleComplete = () => {
    completeLesson(lesson.id);
    setCompleted(true);
  };

  const handleReset = () => {
    resetLesson(lesson.id);
    setCompleted(false);
  };

  return (
    <ReaderShell theme={theme}>
      <header className="reader-header">
        <Link className="icon-button" to={`/s/${section}/${folder}`} aria-label={t("common.back")}>
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="reader-header__title">
          <p className="eyebrow">
            {folderLabel(parent)} · {t("reader.position", { position, total: parent.lessons.length })}
          </p>
          <strong>{lessonLabel(lesson)}</strong>
        </div>
        {completed ? (
          <span className="reader-done-mark" aria-label={t("lesson.completed")}>
            <Check size={16} weight="bold" aria-hidden="true" />
          </span>
        ) : (
          <span />
        )}
      </header>

      <div className="reader-scroll">
        <article className="reader-article">
          <MarkdownViewer body={lesson.body} />
        </article>

        <div className="reader-action">
          <button
            className={`primary-button ${completed ? "primary-button--completed" : ""}`}
            type="button"
            onClick={handleComplete}
            disabled={completed}
          >
            {completed && <Check size={16} weight="bold" aria-hidden="true" />}
            {completed ? t("lesson.completed") : t("lesson.complete")}
          </button>
          {completed && (
            <button className="reader-secondary-button" type="button" onClick={handleReset}>
              {t("lesson.markUnread")}
            </button>
          )}
        </div>

        <nav className="reader-pager" aria-label={t("reader.pager")}>
          {previous ? (
            <Link className="reader-pager__link" to={lessonPath(previous)}>
              <ArrowLeft size={15} aria-hidden="true" />
              <span>
                <em>{t("reader.previous")}</em>
                {lessonLabel(previous)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="reader-pager__link reader-pager__link--next" to={lessonPath(next)}>
              <span>
                <em>{t("reader.next")}</em>
                {lessonLabel(next)}
              </span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </ReaderShell>
  );
}
