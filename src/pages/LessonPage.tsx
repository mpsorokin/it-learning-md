import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { BookmarkSimple } from "@phosphor-icons/react/dist/csr/BookmarkSimple";
import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { ReaderShell } from "@/components/layout/ReaderShell";
import { MarkdownViewer } from "@/features/reading/MarkdownViewer";
import { FlowQuestionList } from "@/features/flows/FlowQuestionList";
import { flowTopicPath, getFlowForLesson, orderedFlowLessons, orderedLessonNeighbours } from "@/features/flows/flow";
import { useReaderTheme } from "@/features/reading/ReaderThemeProvider";
import { useReadingScroll } from "@/features/reading/useReadingScroll";
import { lessonNeighbours, lessonScrollRatio } from "@/features/progress/metrics";
import { useProgressActions } from "@/features/progress/useProgress";
import { findFolder, findLesson, folderPath, lessonPath, loadLessonBody } from "@/lib/content";
import { parseInterviewQuestions } from "@/lib/contentParsing";
import { useStudyActions, useStudyState } from "@/features/study/useStudy";
import { useContentLabels } from "@/lib/labels";

export function LessonPage() {
  const { section = "", folder = "", lesson: slug = "" } = useParams();
  const { t } = useTranslation();
  const { theme } = useReaderTheme();
  const { lessonLabel, folderLabel } = useContentLabels();
  const { completeLesson, resetLesson, getProgressSnapshot, setLessonScroll } = useProgressActions();
  const study = useStudyState();
  const { setBookmarked, setNote } = useStudyActions();

  const lesson = findLesson(section, folder, slug);
  const parent = findFolder(section, folder);
  const flow = getFlowForLesson(lesson);
  const flowLessons = flow ? orderedFlowLessons(flow) : [];
  const flowNeighbours = lesson ? orderedLessonNeighbours(flowLessons, lesson.id) : { index: -1 };
  const flowIndex = flowNeighbours.index;

  /**
   * Mirrors the store rather than subscribing to it: the button has to flip the
   * instant it is pressed, and reading through the state context would re-render
   * the whole reader — markdown included — on every tick anywhere in the app.
   */
  const [completed, setCompleted] = useState(false);
  const [loadedBody, setLoadedBody] = useState<{ lessonId: string; body: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSave, setNoteSave] = useState<"saved" | "pending" | "failed">("saved");
  const noteTimer = useRef<number | null>(null);
  const noteDraftRef = useRef(noteDraft);

  useEffect(() => {
    if (lesson) setCompleted(Boolean(getProgressSnapshot().lessons[lesson.id]?.completedAt));
  }, [lesson, getProgressSnapshot]);

  useEffect(() => {
    if (!lesson) return;
    let active = true;
    setLoadedBody(null);
    setLoadError(false);
    void loadLessonBody(lesson.id).then(
      (body) => active && setLoadedBody({ lessonId: lesson.id, body }),
      () => active && setLoadError(true),
    );
    return () => { active = false; };
  }, [lesson?.id, retry]);

  const storedNote = lesson ? study.lessons[lesson.id]?.note ?? "" : "";

  useEffect(() => {
    if (noteSave !== "saved" || noteDraftRef.current === storedNote) return;
    noteDraftRef.current = storedNote;
    setNoteDraft(storedNote);
  }, [lesson?.id, storedNote, noteSave]);

  useEffect(() => {
    const flush = () => {
      if (!lesson || noteTimer.current === null) return;
      window.clearTimeout(noteTimer.current);
      noteTimer.current = null;
      setNoteSave(setNote(lesson.id, noteDraftRef.current) ? "saved" : "failed");
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (noteTimer.current !== null) {
        window.clearTimeout(noteTimer.current);
        noteTimer.current = null;
        if (lesson) setNote(lesson.id, noteDraftRef.current);
      }
    };
  }, [lesson?.id, setNote]);

  const scroller = useRef<HTMLDivElement>(null);
  const savedRatio = lesson ? lessonScrollRatio(getProgressSnapshot(), lesson.id) : 0;
  const body = lesson && loadedBody?.lessonId === lesson.id ? loadedBody.body : null;

  useReadingScroll(scroller, {
    lessonId: body !== null ? lesson?.id ?? "" : "",
    scrollRatio: savedRatio,
    setLessonScroll,
  });

  if (!lesson || !parent) return <Navigate to="/not-found" replace />;

  const { index: folderIndex, previous: folderPrevious, next: folderNext } = lessonNeighbours(parent, lesson);
  const index = flowIndex >= 0 ? flowIndex : folderIndex;
  const previous = flowIndex >= 0 ? flowNeighbours.previous : folderPrevious;
  const next = flowIndex >= 0 ? flowNeighbours.next : folderNext;
  const position = index + 1;
  const backTo = flow ? flowTopicPath(flow.id, folder) : folderPath(parent);

  const handleComplete = () => {
    completeLesson(lesson.id);
    setCompleted(true);
  };

  const handleReset = () => {
    resetLesson(lesson.id);
    setCompleted(false);
  };

  const updateNote = (value: string) => {
    noteDraftRef.current = value;
    setNoteDraft(value);
    setNoteSave("pending");
    if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => {
      noteTimer.current = null;
      setNoteSave(setNote(lesson.id, noteDraftRef.current) ? "saved" : "failed");
    }, 450);
  };

  const flushNote = () => {
    if (noteTimer.current === null) return;
    window.clearTimeout(noteTimer.current);
    noteTimer.current = null;
    setNoteSave(setNote(lesson.id, noteDraftRef.current) ? "saved" : "failed");
  };

  return (
    <ReaderShell theme={theme}>
      <header className="reader-header">
        <Link className="icon-button" to={backTo} aria-label={t("common.back")}>
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="reader-header__title">
          <p className="eyebrow">
            {folderLabel(parent)} · {t("reader.position", {
              position,
              total: flowIndex >= 0 ? flowLessons.length : parent.lessons.length,
            })}
          </p>
          <strong>{lessonLabel(lesson)}</strong>
        </div>
        <div className="reader-header__actions">
          <button
            className={`reader-bookmark ${study.lessons[lesson.id]?.bookmarked ? "reader-bookmark--active" : ""}`}
            type="button"
            aria-pressed={Boolean(study.lessons[lesson.id]?.bookmarked)}
            aria-label={t(study.lessons[lesson.id]?.bookmarked ? "study.removeBookmark" : "study.addBookmark")}
            onClick={() => setBookmarked(lesson.id, !study.lessons[lesson.id]?.bookmarked)}
          >
            <BookmarkSimple size={18} weight={study.lessons[lesson.id]?.bookmarked ? "fill" : "regular"} aria-hidden="true" />
          </button>
          {completed && <span className="reader-done-mark" aria-label={t("lesson.completed")}><Check size={16} weight="bold" aria-hidden="true" /></span>}
        </div>
      </header>

      <div className="reader-scroll" ref={scroller} aria-busy={body === null && !loadError}>
        {body !== null ? (
          <>
            <article className="reader-article">
              {flow ? (
                <FlowQuestionList questions={parseInterviewQuestions(lesson.id, body)} />
              ) : (
                <MarkdownViewer key={lesson.id} body={body} />
              )}
            </article>

            <section className="reader-notes" aria-labelledby="reader-notes-heading">
              <label id="reader-notes-heading" htmlFor="lesson-note">{t("study.noteTitle")}</label>
              <textarea
                id="lesson-note"
                value={noteDraft}
                maxLength={10_000}
                placeholder={t("study.notePlaceholder")}
                onChange={(event) => updateNote(event.target.value)}
                onBlur={flushNote}
              />
              <div className="reader-notes__footer">
                <span role="status">{t(`study.note${noteSave === "failed" ? "Error" : noteSave === "pending" ? "Saving" : "Saved"}`)}</span>
                <span>{noteDraft.length} / 10000</span>
              </div>
            </section>
          </>
        ) : loadError ? (
          <section className="reader-load-state" role="alert">
            <p>{t("reader.loadError")}</p>
            <button className="primary-button" type="button" onClick={() => setRetry((value) => value + 1)}>{t("reader.retry")}</button>
          </section>
        ) : (
          <p className="reader-load-state" role="status">{t("reader.loading")}</p>
        )}

        {body !== null && <div className="reader-action">
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
        </div>}

        {body !== null && <nav className="reader-pager" aria-label={t("reader.pager")}>
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
        </nav>}
      </div>
    </ReaderShell>
  );
}
