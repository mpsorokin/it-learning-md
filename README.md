# IT Theory

A markdown viewer for IT theory. Lessons are `.md` files in this repository; the
app renders them with syntax highlighting, tracks which ones you have finished,
and keeps that entirely in your browser. Interface in English and Russian.

```
npm install
npm run dev
```

## Adding content

The catalogue is the filesystem. Three levels, no index file to update:

```
src/content/
  typescript/              ← section
    01-foundation/         ← folder
      01-type-inference.md ← lesson
```

Drop a `.md` file in the folder. Slug and order come from the filename
(`01-type-inference.md` → slug `type-inference`, order `1`). The catalogue
title is the first `# heading`, or a humanized slug if there isn't one.
Files with no numeric prefix sort last, alphabetically.

Section and folder names come from `src/i18n/locales/*.json` under
`content.<section>.title` and `content.<section>.<folder>.title`. Without a
key the folder name is shown as-is, so a new folder is never a broken screen.

Code fences must be `ts`, `text` or `json`. The reader registers only those
three grammars — the other 34 that ship with highlight.js were most of the
markdown chunk — so a fence in any other language renders unstyled.
Adding a language is two lines in `src/features/reading/rehypeHighlight.ts`.

Drop a file in with `npm run dev` running and it appears immediately.

The `fullstack-interview` section is a guided flow: its 42 folders are topics,
and each Markdown lesson is one subtopic. The flow groups topics in its UI; those
groups do not add another content directory level. Keep each flow lesson to 1–10
questions or tasks, give every prompt a unique `question-id`, and put any task
conditions or code before its answer marker:

```md
# Execution context, stack и scope

## Interview questions

### Что происходит при выполнении JavaScript-файла?

<!-- question-id: js-runtime-q01 -->

#### Ответ

<!-- Add the reference answer here when ready. -->
```

An empty answer stays visible as “Answer not added yet” and is excluded from
practice. Completing a subtopic is always manual; reading position alone does
not complete it.

At build time, `build/contentIndexPlugin.ts` reads lesson headings and question
prompts into a compact catalogue. Lesson bodies are separate lazy chunks loaded
when a reader opens a lesson. The full text search index is split by section and
loaded only when the search page opens. Adding a lesson still means adding a
Markdown file; the catalogue and index are generated automatically.

## Progress

Each lesson tracks reading position (scroll ratio) and completion separately.
Opening a lesson saves where you stopped; the folder screen shows a bar on each
lesson card. Pressing **Mark as done** in the reader marks it finished. All of
this lives in `localStorage` under `ittheory:progress:v1`; folder and section
bars count completed lessons only.

`src/lib/storage.ts` is deliberately paranoid: the browser is the only place
this data lives, so a blob it cannot parse — a future schema, a bad write from
another tab — is copied to `<key>.bak` before anything overwrites it. Settings →
**Export progress** writes a JSON file you can import on another machine;
importing replaces rather than merges, and validates through the same parser.
Backup version 3 includes practice, notes and bookmarks. Versions 1 and 2 remain
importable. Notes are plain text, saved automatically per lesson, and capped at
10,000 characters. They are stored through the same defensive storage layer and
are never rendered as Markdown.

The overview's Continue card resumes the most recently opened unfinished lesson,
restoring its saved scroll position after that lesson's chunk loads. Marking a
lesson complete does not prevent reopening it or saving notes and bookmarks.

Search is available from the library and at `#/search?q=...`. It finds text in
lesson prose and code examples, ignores case and treats `ё` like `е`. Results
link directly to the matching lesson.

## Scripts

|                        |                                                                   |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | dev server                                                        |
| `npm run build`        | production build into `dist/`                                     |
| `npm run preview`      | serve the build                                                   |
| `npm run typecheck`    | `tsc --noEmit`                                                    |
| `npm run format`       | Prettier over everything except the lessons; also sorts imports   |
| `npm run format:check` | the same, without writing                                         |
| `npm test`             | focused tests for generated content, search, progress and backups |

## Installing as an app

The production site includes a Web App Manifest and a Workbox service worker, so
Chrome and Edge can install IT Theory as a standalone app. Open the deployed
HTTPS site and choose **Install IT Theory** from the browser menu. After the
first online visit finishes caching, the app displays that it is ready offline.
The cache includes every lesson, search index and application asset. New releases
are offered in the app and applied only after the learner chooses Update.

## Layout

```
src/
  app/        routes and providers
  components/ layout, ui, feedback
  features/
    progress/ the store, its metrics, its provider, export / import
    practice/  question metadata, spaced repetition and practice history
    reading/  markdown viewer, reader shell and theme
    study/    local notes and bookmarks
    content/  full-text search
    offline/  service worker readiness and update prompt
  build/      generated catalogue and search index Vite plugin
  i18n/       i18next setup and locales
  lib/        content index, storage
  pages/      every screen, one file each
  styles/     tokens, base, one file per component area
  content/    the lessons
```

Styles are plain CSS in cascade layers; Tailwind contributes its `@theme` token
system and utility layer, with Preflight left out. Colours, radii and the shared
transition duration are tokens in `src/styles/theme.css` — change them there and
the whole app follows. The frame every raised surface shares (border, radius,
background) is one rule in `components/cards.css`, not a copy per screen.
