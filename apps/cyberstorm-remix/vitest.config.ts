import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

const cyberstormRoot = new URL("./cyberstorm", import.meta.url).pathname;
const appRoot = new URL("./app", import.meta.url).pathname;

export default defineProject({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      app: appRoot,
      cyberstorm: cyberstormRoot,
    },
  },
  test: {
    include: [
      "**/__tests__/**/*.test.ts",
      "**/__tests__/**/*.test.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    exclude: ["dist/**/*", "node_modules/**/*"],
    browser: {
      provider: "playwright",
      enabled: true,
      instances: [{ browser: "chromium", headless: true }],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
  optimizeDeps: {
    include: [
      "lodash/isEqual",
      "semver/functions/valid",
      "react/jsx-dev-runtime",
      "react",
      "react-router",
      "react-dom",
      "react-dom/client",
      "react-dom/server",
      "@testing-library/react",
      "@testing-library/user-event",
      "jszip",
    ],
  },
});
