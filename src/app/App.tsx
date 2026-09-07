import { lazy } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Providers } from "@/app/Providers";
import { OverviewPage } from "@/pages/OverviewPage";

/**
 * The overview is the entry point and loads eagerly; everything else is split
 * out, which keeps the markdown renderer out of the first paint.
 */
const LibraryPage = lazy(() => import("@/pages/LibraryPage").then((m) => ({ default: m.LibraryPage })));
const SectionPage = lazy(() => import("@/pages/SectionPage").then((m) => ({ default: m.SectionPage })));
const FolderPage = lazy(() => import("@/pages/FolderPage").then((m) => ({ default: m.FolderPage })));
const LessonPage = lazy(() =>
  import("@/features/reading/pages/LessonPage").then((m) => ({ default: m.LessonPage })),
);
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

/** Hash routing: the app is deployed as static files with no server rewrites. */
export function App() {
  return (
    <HashRouter>
      <Providers>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/s/:section" element={<SectionPage />} />
          <Route path="/s/:section/:folder" element={<FolderPage />} />
          <Route path="/s/:section/:folder/:lesson" element={<LessonPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </Providers>
    </HashRouter>
  );
}
