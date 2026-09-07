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
  typescript/          ← section
    basic/             ← folder
      01-types.md      ← lesson
```

A lesson starts with frontmatter:

```markdown
---
title: Primitive types
titleRu: Примитивные типы
order: 1
---

# Primitive types
…
```

- `title` is required. `titleRu` is optional and falls back to `title`.
- `order` is optional — the `NN-` filename prefix is used instead. Files with
  neither sort last, alphabetically.
- Section and folder names come from `src/i18n/locales/*.json` under
  `content.<section>.title` and `content.<section>.<folder>.title`. Without a
  key the folder name is shown as-is, so a new folder is never a broken screen.

Drop a file in with `npm run dev` running and it appears immediately.
`npm run test:content` checks depth, titles, and duplicate orders.

Lesson bodies ship inside the main bundle (`import.meta.glob` with `eager: true`
in `src/lib/content.ts`). That is what makes authoring this cheap. Past roughly a
megabyte of markdown, move the bodies to a lazy glob and keep only the
frontmatter eager.

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
| `npm test` | unit + content + i18n suites |

Tests run on `node --test` against the TypeScript sources directly — no test
framework, no build step (`tests/support/ts-alias-hooks.mjs` resolves the `@/`
alias). `tests/i18n.test.mjs` checks both directions: no key used in the source
is missing from the locales, and no key in the locales goes unrendered.

## Layout

```
src/
  app/        routes and providers
  components/ layout, ui, feedback
  features/
    progress/ the store, its metrics, its provider
    reading/  markdown viewer, lesson page, reader theme
    backup/   export / import
  i18n/       i18next setup and locales
  lib/        content index, frontmatter parser, storage
  styles/     tokens, base, one file per component area
  content/    the lessons
```

Styles are plain CSS in cascade layers; Tailwind contributes its `@theme` token
system and utility layer, with Preflight left out. Every colour is a token in
`src/styles/theme.css` — change the palette there and the whole app follows.
