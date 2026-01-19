import { Suspense, lazy } from "react";
import { createHashRouter } from "react-router-dom";

// Lazy load components
const AppLayout = lazy(() => import("../components/layout/AppLayout"));
const GameSelectionScreen = lazy(() => import("../pages/GameSelection"));

const Profiles = lazy(() => import("../pages/Profiles"));
const Manager = lazy(() => import("../pages/Manager"));
const GameDashboard = lazy(() => import("../pages/GameDashboard"));
const InstalledModView = lazy(
  () => import("../components/views/InstalledModView")
);
const OnlineModView = lazy(() => import("../components/views/OnlineModView"));
const PackageDetailsView = lazy(
  () => import("../components/views/PackageDetailsView")
);
const SettingsView = lazy(() => import("../components/settings/SettingsView"));
const ConfigEditorView = lazy(
  () => import("../components/views/ConfigEditorView")
);
const HelpView = lazy(() => import("../components/views/HelpView"));
const DownloadsView = lazy(() => import("../components/views/DownloadsView"));

// Loading fallback
const LoadingFallback = () => <div>Loading...</div>;

export const router = createHashRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AppLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <GameSelectionScreen />
          </Suspense>
        ),
      },
      {
        path: "profiles",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Profiles />
          </Suspense>
        ),
      },
      {
        path: "manager",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Manager />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <GameDashboard />
              </Suspense>
            ),
          },
          {
            path: "installed",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <InstalledModView />
              </Suspense>
            ),
          },
          {
            path: "online",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <OnlineModView />
              </Suspense>
            ),
          },
          {
            path: "settings",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <SettingsView />
              </Suspense>
            ),
          },
          {
            path: "config-editor",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <ConfigEditorView />
              </Suspense>
            ),
          },
          {
            path: "help",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <HelpView />
              </Suspense>
            ),
          },
          {
            path: "downloads",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <DownloadsView />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "c/:community/p/:namespace/:package",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PackageDetailsView />
          </Suspense>
        ),
      },
      {
        path: "c/:community/p/:namespace/:package/v/:version",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PackageDetailsView />
          </Suspense>
        ),
      },
    ],
  },
]);
