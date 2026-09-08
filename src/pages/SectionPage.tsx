import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ContentRow } from "@/components/ui/ContentRow";
import { TallyCard } from "@/components/ui/TallyCard";
import { folderProgress, sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { findSection } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

/** The folders inside one section, each with its own done/total. */
export function SectionPage() {
  const { section: slug = "" } = useParams();
  const { t } = useTranslation();
  const progress = useProgressState();
  const { sectionLabel, folderLabel } = useContentLabels();

  const section = findSection(slug);
  if (!section) return <Navigate to="/not-found" replace />;

  const tally = sectionProgress(progress, section);

  return (
    <AppShell title={sectionLabel(section)} backTo="/library">
      <TallyCard
        label={t("section.progress")}
        value={t("common.doneOfTotal", { done: tally.done, total: tally.total })}
        ratio={tally.ratio}
      />

      <ul className="content-list">
        {section.folders.map((folder) => {
          const folderTally = folderProgress(progress, folder);
          return (
            <li key={folder.id}>
              <ContentRow
                to={`/s/${section.slug}/${folder.slug}`}
                title={folderLabel(folder)}
                count={t("common.doneOfTotal", { done: folderTally.done, total: folderTally.total })}
                ratio={folderTally.ratio}
                meta={t("library.lessonCount", { count: folder.lessons.length })}
              />
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
