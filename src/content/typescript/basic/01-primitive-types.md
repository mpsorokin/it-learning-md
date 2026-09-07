---
title: Primitive types
titleRu: Примитивные типы
order: 1
---

# Primitive types

TypeScript adds a static type layer on top of JavaScript. The layer is erased at
build time: what runs in the browser is plain JavaScript, and every type below
exists only while you are writing code.

## The three you will use constantly

```ts
let title: string = "Reading list";
let count: number = 42;
let published: boolean = false;
```

Writing the annotation is usually unnecessary. TypeScript **infers** the type
from the initial value, and the inferred type is exactly as strict:

```ts
let title = "Reading list"; // string
title = 7;                  // Error: Type 'number' is not assignable to type 'string'
```

Annotate when there is no value to infer from — a function parameter, an empty
array, a variable declared before it is assigned.

## `null` and `undefined`

With `strictNullChecks` on (it is part of `strict`, which you should always
enable), these are separate types and are not assignable to anything else:

```ts
let name: string = null;         // Error under strict mode
let maybe: string | null = null; // fine — the union says so explicitly
```

This is the single most valuable rule TypeScript enforces. It turns "cannot read
property of undefined" from a runtime crash into a compile error.

## `any` versus `unknown`

`any` switches the checker off for a value. `unknown` says "I do not know yet"
and forces you to narrow before use:

```ts
function parse(raw: string): unknown {
  return JSON.parse(raw);
}

const data = parse("{}");
data.title;                     // Error: 'data' is of type 'unknown'

if (typeof data === "object" && data !== null && "title" in data) {
  console.log(data.title);      // allowed here
}
```

Reach for `unknown` at every boundary where data enters your program — network
responses, `localStorage`, user input. Reserve `any` for genuine escape hatches,
and leave a comment saying why.

## Literal types

A string literal is also a type. Combined with a union this replaces most enums:

```ts
type Status = "draft" | "published" | "archived";

let status: Status = "draft";
status = "deleted"; // Error: not assignable to type 'Status'
```
