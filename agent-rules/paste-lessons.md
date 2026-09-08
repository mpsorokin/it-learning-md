# Paste lessons as-is

User pastes lesson text and names a folder under `src/content/`. Write that text into that folder **verbatim**.

Do not add or rewrite YAML, headings, interviews, related topics, or i18n.

Do not restructure into a template, translate, lint fences, run tests, typecheck, or build.

Filename: `NN-slug.md` from the first heading (drop a leading `2.` / `3.` if present) and the next or matching numeric prefix in that folder. If the file exists, overwrite.

Do nothing else.
