---
title: Unions and narrowing
titleRu: Объединения и сужение типов
order: 4
---

# Unions and narrowing

A union says a value is one of several types. **Narrowing** is how you convince
the compiler which one it is right now.

```ts
function format(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2); // narrowed to number
  }
  return value.trim();       // narrowed to string
}
```

The checker follows ordinary JavaScript control flow — `typeof`, `instanceof`,
truthiness, `in`, and equality all narrow.

## Discriminated unions

The most useful pattern in the language. Give each member a shared literal field:

```ts
type Result =
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "failed"; error: Error };

function render(result: Result): string {
  switch (result.status) {
    case "loading":
      return "…";
    case "ready":
      return result.body; // only this branch has `body`
    case "failed":
      return result.error.message;
  }
}
```

Impossible states — a `body` alongside an `error` — become unrepresentable
rather than merely unlikely.

## Exhaustiveness

Add a `never` check and the compiler will fail the build when a new member is
added and a branch is forgotten:

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

function describe(result: Result): string {
  switch (result.status) {
    case "loading":
      return "Loading";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return assertNever(result);
  }
}
```

Add `{ status: "cancelled" }` to `Result` and `assertNever` stops compiling —
exactly where you need to be told.

## Type predicates

When the narrowing logic lives in its own function, say so in the return type:

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (isRecord(payload)) {
  payload.title; // allowed
}
```

Without `value is …` the function returns a plain `boolean` and narrows nothing.
Predicates are unchecked assertions — the body must actually establish what the
signature claims.
