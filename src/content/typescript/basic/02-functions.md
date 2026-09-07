---
title: Functions
titleRu: Функции
order: 2
---

# Functions

Parameters must be annotated — there is nothing to infer them from. The return
type is usually inferred, and letting it be inferred is the better default: it
stays correct when the body changes.

```ts
function slugify(title: string, separator = "-"): string {
  return title.toLowerCase().trim().split(/\s+/).join(separator);
}
```

`separator` has a default, which makes it optional at the call site *and* gives
it the type `string` without an annotation.

## Optional parameters

```ts
function greet(name: string, title?: string) {
  // `title` here has the type `string | undefined`
  return title ? `${title} ${name}` : name;
}
```

Optional parameters must come after required ones. If you find yourself with
three or more, take an options object instead:

```ts
interface FetchOptions {
  method?: "GET" | "POST";
  timeoutMs?: number;
  signal?: AbortSignal;
}

function request(url: string, options: FetchOptions = {}) {
  // …
}
```

## Function types

A function is a value, so it has a type you can name and reuse:

```ts
type Comparator<T> = (a: T, b: T) => number;

const byLength: Comparator<string> = (a, b) => a.length - b.length;
```

Notice `a` and `b` need no annotations: TypeScript reads them off the
`Comparator<string>` on the left. This is **contextual typing**, and it is why
callbacks passed to `map` / `filter` / `sort` rarely need annotating either.

## `void` and `never`

`void` is "returns nothing useful". `never` is "does not return at all":

```ts
function log(message: string): void {
  console.log(message);
}

function fail(message: string): never {
  throw new Error(message);
}
```

`never` is what makes exhaustiveness checks work — see the narrowing lesson.
