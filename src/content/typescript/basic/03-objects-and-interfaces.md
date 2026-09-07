---
title: Objects, interfaces and type aliases
titleRu: Объекты, интерфейсы и псевдонимы типов
order: 3
---

# Objects, interfaces and type aliases

Two ways to name an object shape:

```ts
interface Lesson {
  id: string;
  title: string;
  order: number;
  titleRu?: string;         // optional
  readonly section: string; // cannot be reassigned after construction
}

type LessonAlias = {
  id: string;
  title: string;
};
```

## Which one?

They overlap almost entirely. The practical differences:

| | `interface` | `type` |
|---|---|---|
| Object shapes | yes | yes |
| Unions, tuples, primitives | no | yes |
| Combining | `extends` | `&` |
| Declaration merging | yes | no |
| Error messages | keeps the name | often expanded inline |

A reasonable house rule: **`interface` for object shapes you export, `type` for
everything else** — unions, mapped types, function types. Do not spend time
converting an existing codebase from one to the other.

## Extending

```ts
interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

interface Article extends Timestamped {
  title: string;
}

// the `type` equivalent
type ArticleAlias = Timestamped & { title: string };
```

## Excess property checks

Object literals are checked more strictly than variables — a deliberate trap for
typos:

```ts
interface Options {
  retries?: number;
}

request("/api", { retrys: 3 }); // Error: 'retrys' does not exist in type 'Options'

const opts = { retrys: 3 };
request("/api", opts);          // no error — the check only applies to literals
```

## Index signatures

When the keys are not known ahead of time:

```ts
type ProgressMap = Record<string, { completedAt: string }>;

const progress: ProgressMap = {};
progress["typescript/basic/01"] = { completedAt: new Date().toISOString() };
```

Under `noUncheckedIndexedAccess` a lookup yields `T | undefined`, which is what
you actually want — the key may not be there.
