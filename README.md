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

Lesson bodies ship inside the main bundle (`import.meta.glob` with `eager: true`
in `src/lib/content.ts`). That is what makes authoring this cheap. Past roughly a
megabyte of markdown, switch the bodies to a lazy glob.

## Progress

A lesson is done or not done — there is no partial state. Pressing **Mark as
done** in the reader writes to `localStorage` under `ittheory:progress:v1`;
folder and section bars are counted from that.

`src/lib/storage.ts` is deliberately paranoid: the browser is the only place
this data lives, so a blob it cannot parse — a future schema, a bad write from
another tab — is copied to `<key>.bak` before anything overwrites it. Settings →
**Export progress** writes a JSON file you can import on another machine;
importing replaces rather than merges, and validates through the same parser.

## Scripts

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the build |
| `npm run typecheck` | `tsc --noEmit` |

## Installing as an app

The production site includes a Web App Manifest, so Chrome and Edge can install
IT Theory as a standalone app. Open the deployed HTTPS site, choose **Install IT
Theory** from the browser menu (or the install icon in the address bar), and the
app will appear in the desktop app list or on the desktop. The app currently has
no offline cache, so its lessons still require the site to be reachable.

## Layout

```
src/
  app/        routes and providers
  components/ layout, ui, feedback
  features/
    progress/ the store, its metrics, its provider, export / import
    reading/  markdown viewer, reader theme
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
