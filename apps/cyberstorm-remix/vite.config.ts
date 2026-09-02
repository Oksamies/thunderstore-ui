import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig((config) => {
  const { mode } = config;
  const env = loadEnv(mode, process.cwd(), "");

  // Extra allowed hosts (comma separated) so the dev server accepts requests
  // proxied by nginx, e.g. ".thunderstore.localhost".
  const additionalAllowedHosts = (
    env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ?? ""
  )
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);

  return {
    server: {
      // Bind to all interfaces so the nginx container can reach the dev server
      // on the host via host.docker.internal:3000. Note this also exposes the
      // dev server (with source maps + HMR) to the local network — fine on a
      // trusted machine; avoid running it on untrusted/public Wi-Fi.
      host: true,
      port: 3000,
      strictPort: true,
      // Native file watching is fast on Windows/macOS/Linux. Polling is only
      // needed inside WSL2 or a bind-mounted container; opt in with
      // VITE_USE_POLLING=true there instead of paying its cost everywhere.
      watch:
        env.VITE_USE_POLLING === "true"
          ? { usePolling: true, interval: 500 }
          : undefined,
      hmr: { path: "/react-router" },
      allowedHosts: [
        ".thunderstore.dev",
        ".thunderstore.io",
        ".thunderstore.localhost",
        ...additionalAllowedHosts,
      ],
    },
    plugins: [
      reactRouter(),
      tsconfigPaths(),
      env.SENTRY_ORG && env.SENTRY_PROJECT
        ? sentryReactRouter(
            {
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              authToken: env.SENTRY_AUTH_TOKEN,
            },
            config
          )
        : null,
    ],
    build: {
      // Hashed assets use Vite's default "assets" dir so the production server
      // (@react-router/serve) applies its built-in immutable, 1-year cache to
      // them — it only long-caches the "/assets" path. (Previously "__remix",
      // which missed that rule and left hashed assets at Cache-Control:
      // max-age=0.)

      // Per-route CSS chunks rather than one stylesheet for the whole app.
      // Bundled, every page blocked on all 230KB of it — a community page was
      // downloading the settings, upload and team styles before it could render.
      //
      // This is only safe while no two rules depend on the order their files
      // land in the bundle, because Vite emits chunks in dependency order rather
      // than import order. root.tsx declares the whole @layer order inline at the
      // top of <head> so layers can't be reshuffled, but that does NOT settle
      // rules of equal specificity within the SAME layer — those are decided by
      // source order alone. The base layout primitives are therefore written as
      // :where(.page) / :where(.island), which drops them to zero specificity so
      // a route's own class always wins (see Page.css and Island.css).
      //
      // If you add a base class that routes override, use :where() for it too. A
      // computed-style diff across every route, bundled vs split, is what catches
      // the ones that don't.
      cssCodeSplit: true,
    },
  };
});
