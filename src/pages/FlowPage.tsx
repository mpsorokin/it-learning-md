import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ContentRow } from "@/components/ui/ContentRow";
import { TallyCard } from "@/components/ui/TallyCard";
import { getNextLesson, folderProgress, overallProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { fullstackInterviewFlow, orderedFlowLessons, resolveFlow } from "@/features/flows/flow";
import { findFolder, lessonPath } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

/** The ordered overview for a guided topic flow. */
export function FlowPage() {
  const { flowId = "" } = useParams();
  const { t } = useTranslation();
  const progress = useProgressState();
  const { sectionLabel, folderLabel, lessonLabel } = useContentLabels();
  const flow = resolveFlow(flowId);

  if (!flow) return <Navigate to="/not-found" replace />;

  const lessons = orderedFlowLessons(flow.definition);
  const tally = overallProgress(progress, lessons);
  const completedTopics = flow.topics.filter((topic) => {
    const topicTally = folderProgress(progress, topic.folder);
    return topicTally.total > 0 && topicTally.done === topicTally.total;
  }).length;
  const next = getNextLesson(progress, lessons);
  const nextFolder = next ? findFolder(next.section, next.folder) : undefined;
  const configuredTopicCount = flow.definition.groups.reduce((total, group) => total + group.folderSlugs.length, 0);

  return (
    <AppShell title={sectionLabel(flow.definition.section)} backTo="/library">
      <TallyCard
        label={t("flows.progress")}
        value={t("flows.subtopicsDoneOfTotal", { done: tally.done, total: tally.total })}
        ratio={tally.total > 0 ? tally.ratio : 0}
      />
      <p className="flow-topic-summary">
        {t("flows.topicsDoneOfTotal", { done: completedTopics, total: configuredTopicCount })}
      </p>

      {next && nextFolder ? (
        <Link className="continue-card flow-continue-card" to={lessonPath(next)}>
          <p className="eyebrow">{t("flows.continue")}</p>
          <strong>{lessonLabel(next)}</strong>
          <span className="continue-card__path">
            {folderLabel(nextFolder)} · {t("reader.position", {
              position: lessons.findIndex((lesson) => lesson.id === next.id) + 1,
              total: lessons.length,
            })}
          </span>
          <ArrowRight className="continue-card__arrow" size={18} aria-hidden="true" />
        </Link>
      ) : (
        <p className="empty-note">
          {lessons.length === 0 ? t("flows.noTopics") : t("overview.allDone")}
        </p>
      )}

      <div className="flow-groups">
        {flow.groups.map(({ definition, topics }) => topics.length > 0 && (
          <section className="flow-group" key={definition.id}>
            <h2 className="section-heading">{t(definition.labelKey)}</h2>
            <ul className="content-list">
              {topics.map(({ folder }) => {
                const topicTally = folderProgress(progress, folder);
                const questionCount = folder.lessons.reduce((total, lesson) => total + lesson.questionCount, 0);
                return (
                  <li key={folder.id}>
                    <ContentRow
                      to={`/flows/${flow.definition.id}/${folder.slug}`}
                      title={folderLabel(folder)}
                      count={t("common.doneOfTotal", { done: topicTally.done, total: topicTally.total })}
                      ratio={topicTally.ratio}
                      meta={t("flows.topicMeta", { subtopics: folder.lessons.length, questions: questionCount })}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

// Keep the route's supported flow ID discoverable to route registration and links.
export const defaultFlowId = fullstackInterviewFlow.id;
