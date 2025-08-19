import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
    jsxInject: "import React from 'react'",
  },
});


