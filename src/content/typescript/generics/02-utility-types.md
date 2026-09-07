---
title: Utility types
titleRu: Служебные типы
order: 2
---

# Utility types

The standard library ships a set of generics that derive one type from another.
Deriving beats duplicating: when the source type changes, everything built from
it follows.

```ts
interface Lesson {
  id: string;
  title: string;
  order: number;
  titleRu?: string;
}
```

## Reshaping

```ts
type Draft = Partial<Lesson>;     // every field optional
type Complete = Required<Lesson>; // every field required
type Frozen = Readonly<Lesson>;   // every field readonly

type Card = Pick<Lesson, "id" | "title">; // { id: string; title: string }
type Body = Omit<Lesson, "id">;           // everything except `id`
```

`Omit` is the one to reach for when a create-payload is "the entity minus the
fields the server generates":

```ts
type NewLesson = Omit<Lesson, "id">;
```

## Records and maps

```ts
type Progress = Record<string, { completedAt: string }>;
type ByStatus = Record<"draft" | "published", Lesson[]>;
```

`Record<K, V>` with a union key is checked for exhaustiveness — miss
`"published"` and it will not compile.

## Working with unions

```ts
type Status = "draft" | "published" | "archived";

type Live = Exclude<Status, "archived">;   // "draft" | "published"
type Only = Extract<Status, "draft">;      // "draft"
type Defined = NonNullable<string | null>; // string
```

## Reading a function's types

```ts
declare function loadLesson(id: string, locale: "en" | "ru"): Promise<Lesson>;

type Args = Parameters<typeof loadLesson>;     // [string, "en" | "ru"]
type Returned = ReturnType<typeof loadLesson>; // Promise<Lesson>
type Resolved = Awaited<Returned>;             // Lesson
```

`typeof` in type position reads the type of a *value*. It is how you get from an
existing function or object to a type without writing one out by hand.

## Building your own

They are ordinary mapped types — nothing privileged about them:

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Template literal keys, for a change handler per field:
type Handlers<T> = {
  [K in keyof T & string as `on${Capitalize<K>}Change`]: (value: T[K]) => void;
};

// Handlers<Lesson> is:
// { onIdChange: (value: string) => void; onTitleChange: (value: string) => void; … }
```
