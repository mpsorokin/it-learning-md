---
title: Generics
titleRu: Дженерики
order: 1
---

# Generics

A generic is a type with a parameter. It lets one function describe a
relationship between its input and its output instead of committing to a single
concrete type.

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}

first([1, 2, 3]);  // number | undefined
first(["a", "b"]); // string | undefined
```

`T` is inferred at the call site. Writing `first<number>([1, 2, 3])` is legal but
almost always noise.

Compare the alternatives: `any[]` loses the element type entirely, and one
overload per type does not scale.

## Constraints

`extends` restricts what may be substituted, which is what makes the body
type-safe:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest("alpha", "beta"); // string
longest([1, 2], [3]);     // number[]
longest(10, 20);          // Error: number has no 'length'
```

## `keyof` and indexed access

Together these express "a key of this object" and "the type stored at that key":

```ts
function pluck<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key];
}

const lesson = { id: "ts/basic/01", title: "Types", order: 1 };

pluck(lesson, "title"); // string
pluck(lesson, "order"); // number
pluck(lesson, "nope");  // Error: not assignable to 'id' | 'title' | 'order'
```

The return type follows the key you passed — no cast, no overloads.

## Defaults

A type parameter can have a default, just like a value parameter:

```ts
interface Paged<T, Meta = { total: number }> {
  items: T[];
  meta: Meta;
}

type Lessons = Paged<Lesson>; // meta is { total: number }
```

## When not to reach for one

If a type parameter appears exactly once in a signature, it is doing no work:

```ts
function log<T>(value: T): void {}    // pointless — nothing relates to T
function log(value: unknown): void {} // say what you mean
```

A generic earns its place when it *links* two positions: a parameter to the
return type, or one parameter to another.
