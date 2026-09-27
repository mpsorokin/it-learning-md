import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { contentIndexPlugin } from "./build/contentIndexPlugin.ts";

export default defineConfig({
  // Relative, so the build works from any static host subpath (GitHub Pages).
  base: "./",
  plugins: [
    contentIndexPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      manifest: false,
      registerType: "prompt",
      injectRegister: false,
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff2,svg,png,ico,webmanifest}"],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { host: "0.0.0.0" },
  build: {
    outDir: "dist",
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // React has to be claimed first: it is shared between the entry and
            // every lazy route, so without its own group it is pulled into the
            // markdown chunk and the entry then waits on the whole parser.
            { name: "react", test: /node_modules[/\\](react|react-dom|scheduler)[/\\]/ },
            {
              name: "markdown",
              test: /node_modules[/\\](react-markdown|remark-|rehype-|highlight\.js|lowlight|micromark|mdast-|unist-|unified|vfile|bail|is-plain|devlop|trough|property-information|space-separated-tokens|comma-separated-tokens|hast-|estree-|character-entities)/,
            },
          ],
        },
      },
    },
  },
});
