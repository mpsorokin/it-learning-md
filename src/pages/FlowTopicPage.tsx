import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LessonRow } from "@/components/ui/LessonRow";
import { TallyCard } from "@/components/ui/TallyCard";
import { flowPath, getFlowTopic } from "@/features/flows/flow";
import { folderProgress, isCompleted, lessonScrollRatio } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { lessonPath } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

/** A topic's subtopics; opening a row uses the canonical reader route. */
export function FlowTopicPage() {
  const { flowId = "", topic: topicSlug = "" } = useParams();
  const { t } = useTranslation();
  const progress = useProgressState();
  const { folderLabel, lessonLabel } = useContentLabels();
  const topic = getFlowTopic(flowId, topicSlug);

  if (!topic) return <Navigate to="/not-found" replace />;

  const { folder } = topic;
  const tally = folderProgress(progress, folder);
  const questionCount = folder.lessons.reduce((total, lesson) => total + lesson.questionCount, 0);

  return (
    <AppShell title={folderLabel(folder)} backTo={flowPath(flowId)}>
      <p className="eyebrow flow-topic-group">{t(topic.group.labelKey)}</p>
      <TallyCard
        label={t("flows.topicProgress")}
        value={t("flows.subtopicsDoneOfTotal", { done: tally.done, total: tally.total })}
        ratio={tally.ratio}
      />
      <p className="flow-topic-summary">
        {t("flows.topicMeta", { subtopics: folder.lessons.length, questions: questionCount })}
      </p>

      {folder.lessons.length > 0 ? (
        <ol className="lesson-list flow-lesson-list">
          {folder.lessons.map((lesson, index) => {
            const done = isCompleted(progress, lesson.id);
            const started = Boolean(progress.lessons[lesson.id]);
            const title = lessonLabel(lesson);
            return (
              <li className="flow-lesson-list__item" key={lesson.id}>
                <LessonRow
                  to={lessonPath(lesson)}
                  title={title}
                  index={index}
                  done={done}
                  ratio={lessonScrollRatio(progress, lesson.id)}
                  progressLabel={t("lesson.readingProgress", { title })}
                  completedLabel={t("lesson.completed")}
                />
                <span className="flow-lesson-list__meta">
                  {t("flows.questionCount", { count: lesson.questionCount })}
                  {" · "}
                  {t(
                    done
                      ? "flows.state.completed"
                      : started
                        ? "flows.state.inProgress"
                        : "flows.state.notStarted",
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="empty-note">{t("flows.noSubtopics")}</p>
      )}
    </AppShell>
  );
}
