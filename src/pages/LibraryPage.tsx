import { CaretRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
                <Link className="content-row" to={`/s/${section.slug}`}>
                  <div className="content-row__head">
                    <strong>{sectionLabel(section)}</strong>
                    <span className="content-row__count">
                      {t("common.doneOfTotal", { done: tally.done, total: tally.total })}
                    </span>
                  </div>
                  <ProgressBar value={tally.ratio} />
                  <span className="content-row__meta">
                    {t("library.folderCount", { count: section.folders.length })}
                  </span>
                  <CaretRight className="content-row__caret" size={15} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
