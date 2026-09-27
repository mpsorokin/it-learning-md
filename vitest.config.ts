import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import { contentIndexPlugin } from "./build/contentIndexPlugin.ts";

export default defineConfig({
  plugins: [contentIndexPlugin()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
