import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { loadSearchIndex, searchLessons, type LessonSearchResult } from "@/features/content/search";
import { findLessonById, lessonPath } from "@/lib/content";
import type { SearchIndexEntry } from "@/lib/content.types";
import { useContentLabels } from "@/lib/labels";

export function SearchPage() {
  const { t } = useTranslation();
  const { sectionLabel, folderLabel } = useContentLabels();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [index, setIndex] = useState<SearchIndexEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const results: LessonSearchResult[] = useMemo(
    () => (index ? searchLessons(index, query) : []),
    [index, query],
  );

  useEffect(() => {
    let active = true;
    setFailed(false);
    void loadSearchIndex().then(
      (entries) => active && setIndex(entries),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [retry]);

  const updateQuery = (value: string) => {
    setParams(value ? { q: value } : {}, { replace: true });
  };

  return (
    <AppShell title={t("search.title")} backTo="/library">
      <form className="search-form" role="search" onSubmit={(event) => event.preventDefault()}>
        <MagnifyingGlass size={18} aria-hidden="true" />
        <input
          type="search"
          autoFocus
          value={query}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          onChange={(event) => updateQuery(event.target.value)}
        />
      </form>
      <p className="search-summary" aria-live="polite">
        {failed
          ? t("search.loadError")
          : index
            ? query
              ? t("search.resultCount", { count: results.length })
              : t("search.hint")
            : t("reader.loading")}
      </p>
      {failed && (
        <button
          className="primary-button"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          {t("reader.retry")}
        </button>
      )}
      {query && results.length > 0 && (
        <ol className="search-results">
          {results.map((result) => {
            const lesson = findLessonById(result.lessonId);
            if (!lesson) return null;
            const section = sectionLabel(lesson.section);
            const folder = folderLabel({
              id: `${lesson.section}/${lesson.folder}`,
              section: lesson.section,
              slug: lesson.folder,
              lessons: [],
            });
            return (
              <li key={result.lessonId}>
                <Link className="search-result card" to={lessonPath(lesson)}>
                  <span className="search-result__path">
                    {section} · {folder}
                  </span>
                  <strong>{lesson.title}</strong>
                  <span className="search-result__snippet">{result.snippet}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {query && index && results.length === 0 && (
        <p className="empty-note">{t("search.noResults")}</p>
      )}
    </AppShell>
  );
}
