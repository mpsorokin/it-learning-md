import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { ContentRow } from "@/components/ui/ContentRow";
import { sectionProgress } from "@/features/progress/metrics";
import { useProgressState } from "@/features/progress/useProgress";
import { sections } from "@/lib/content";
import { useContentLabels } from "@/lib/labels";

/** Every section, with its folder count and progress. */
export function LibraryPage() {
  const { t } = useTranslation();
  const progress = useProgressState();
  const { sectionLabel } = useContentLabels();

  return (
    <AppShell title={t("nav.library")}>
      {sections.length === 0 ? (
        <p className="empty-note">{t("overview.noContent")}</p>
      ) : (
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
      )}
    </AppShell>
  );
}
