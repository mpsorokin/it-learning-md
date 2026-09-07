import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { NotFound } from "@/components/feedback/NotFound";

/**
 * After a redeploy the hashed chunk names change, so an old open tab asks for a
 * chunk that no longer exists. Reloading is the only useful recovery there.
 */
function isChunkLoadError(error: Error): boolean {
  return /dynamically imported module|importing a module script failed|chunkloaderror|failed to fetch/i.test(
    error.message,
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Changing this clears a caught error — see `ErrorBoundary` below. */
  resetKey: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  resetKey: string;
}

class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  /** Resets on navigation without remounting the subtree below the boundary. */
  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    return props.resetKey === state.resetKey ? null : { error: null, resetKey: props.resetKey };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("IT Theory crashed while rendering.", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <ErrorScreen error={error} />;
  }
}

/** Split out of the class so the copy follows the interface language. */
function ErrorScreen({ error }: { error: Error }) {
  const { t } = useTranslation();
  const stale = isChunkLoadError(error);

  return (
    <NotFound
      title={stale ? t("errors.appUpdated") : t("errors.somethingWrong")}
      description={stale ? t("errors.appUpdatedDescription") : t("errors.somethingWrongDescription")}
      action={{ label: t("errors.reload"), onClick: () => window.location.reload() }}
      detail={!stale && <code className="error-detail">{error.message}</code>}
    />
  );
}

/**
 * Without a reset a single failed route leaves the whole app stuck on the error
 * screen: navigating away never clears the boundary's state. The location key is
 * passed as a prop rather than as `key` on purpose — a `key` would remount the
 * `Suspense` below on every navigation and flash the route fallback.
 */
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundaryBase resetKey={location.key}>{children}</ErrorBoundaryBase>;
}
