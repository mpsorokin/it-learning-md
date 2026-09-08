# Working in this repository

Read `README.md` first — it covers the content format, the progress model and
the scripts. What follows is only the things that are easy to get wrong.

## Before you finish

```
npm run typecheck && npm run build
```

There is no linter. `tsc --noEmit` and the production build are the gate.

## Conventions that are load-bearing

**Storage.** Everything persisted goes through `src/lib/storage.ts`. A `parse`
function returns `null` for anything it does not recognise — including a *newer*
schema version — which is what triggers the `.bak` copy. Never widen a parser to
accept an unknown shape, and never write to `localStorage` directly.

**Progress context.** `ProgressProvider` exposes state and actions as two
separate contexts. A component that only writes must use `useProgressActions()`;
reaching for `useProgressState()` there re-renders it on every tick anywhere in
the app. The reader mirrors completion in local state for exactly this reason.

**i18n.** Every user-visible string is a key in both `en.json` and `ru.json`.
Removing UI means removing its keys. Keys assembled at runtime are only
`content.`, for section and folder names.

**Styles.** No CSS modules, no inline style objects for anything themable. Add a
class in the matching `src/styles/components/*.css` and a token in `theme.css`
if a new colour is genuinely needed — no raw hex outside `theme.css`. Rules
shared by several screens live in the file named for the *thing* (`cards.css`),
not for the screen that happened to need them first: the card frame is one
grouped selector there, so a new card is a selector added to it rather than
three declarations copied again. Radii use `--radius-*`; a value that appears
once stays a literal. The three widths in `responsive.css` are written as
numbers on purpose — a custom property cannot be read inside `@media`. Media queries go in `responsive.css`, all
of them, because they add no specificity and need one late cascade point.
Reader rules read the `--r-*` aliases rather than the palette directly, so the
light surface needs no duplicate selectors.

**Highlighting.** `src/features/reading/rehypeHighlight.ts` replaces
`rehype-highlight`, which statically imports lowlight's `common` set as its
fallback and so ships all 37 grammars whatever you configure. Only `typescript`,
`json` and `plaintext` are registered; an unregistered fence renders plain with
no error.

**Content is trusted.** `MarkdownViewer` runs without a sanitiser because the
markdown is committed to this repository. If content ever arrives from anywhere
else, that assumption has to be revisited before anything else.

**Screens.** Every screen is one file in `src/pages/`, and the repeated pieces of
the catalogue are components — `ContentRow` for a section/folder row, `TallyCard`
for a progress card. A new screen that copies either of those blocks inline is a
review comment, not a shortcut.

**Routes.** `HashRouter`, and `base: "./"` in the Vite config — the app is
deployed as static files with no server rewrites. Neither can change without
breaking the deploy.
