import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["test_mocks/IntersectionObserver.js"],
    globals: true,
  },
  assetsInclude: "**/*.html",
});
