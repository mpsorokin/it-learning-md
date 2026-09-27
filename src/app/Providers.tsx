import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { ProgressProvider } from "@/features/progress/ProgressProvider";
import { PracticeProvider } from "@/features/practice/PracticeProvider";
import { ReaderThemeProvider } from "@/features/reading/ReaderThemeProvider";
import { StudyProvider } from "@/features/study/StudyProvider";
import { OfflineProvider } from "@/features/offline/OfflineProvider";

/** Paints the page colour so a lazy route does not flash the body background. */
function RouteFallback() {
  return <div className="app-background route-fallback" aria-busy="true" />;
}

/**
 * Everything below the router, so `ErrorBoundary` can read the location and
 * clear itself on navigation.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider>
      <PracticeProvider>
        <StudyProvider>
          <ReaderThemeProvider>
            <OfflineProvider>
              <ErrorBoundary>
                <Suspense fallback={<RouteFallback />}>{children}</Suspense>
              </ErrorBoundary>
            </OfflineProvider>
          </ReaderThemeProvider>
        </StudyProvider>
      </PracticeProvider>
    </ProgressProvider>
  );
}
