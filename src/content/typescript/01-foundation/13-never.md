---
title: never
titleRu: Тип never
slug: never
section: foundation
order: 13
difficulty: beginner
estimatedMinutes: 5
tags:
  - typescript
  - never
prerequisites:
  - unions
---

# never

## TL;DR

`never` описывает значение, которое не может существовать. Он появляется в функциях без нормального возврата, невозможных ветках и фильтрации union на уровне типов.

## Mental model

```text
never → empty set of values
```

`never` присваивается любому типу, но ни одно обычное значение не присваивается в `never`.

## Core idea

- Функция с бесконечным циклом или постоянным `throw` возвращает `never`.
- После полного narrowing остаток union становится `never`.
- `never` помогает проверять exhaustive switch.
- В conditional types он часто означает «исключить этот вариант».

> **Interview note**

Не путай `never` и `void`: `void` означает игнорируемый результат, `never` — отсутствие результата вообще.

## Example 1 — Basic

```ts
function fail(message: string): never {
  throw new Error(message);
}

function forever(): never {
  while (true) {}
}
```

Ни одна функция не достигает точки возврата.

## Example 2 — Real-world

```ts
type Role = "admin" | "member";

function permissions(role: Role): string[] {
  switch (role) {
    case "admin": return ["read", "write"];
    case "member": return ["read"];
    default: return assertNever(role);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}
```

Новая роль превратит вызов `assertNever` в compile error, пока ветка не обработана.

## Common mistake

```ts
// problematic
function log(message: string): never {
  console.log(message);
}

// better
function log(message: string): void {
  console.log(message);
}
```

Функция `log` нормально завершается, просто не возвращает полезного значения.

## Interview answer

> **What does `never` mean in TypeScript?**

`never` represents a type with no possible values. It is inferred for code paths that cannot complete normally, such as functions that always throw, and for a union after every case has been eliminated. A practical use is exhaustive checking: passing an unhandled value to a `never` parameter turns a newly added union member into a compile-time error.

## Interview follow-ups

- How is `never` different from `void`?
- Why is `never` assignable to other types?
- How does `never` behave in conditional types?

## Recall

- Почему exhaustive branch получает `never`?
- Какая функция должна возвращать `void`, а не `never`?
- Как `never` помогает при расширении union?

## Mini challenge

Добавь exhaustive-проверку для `"idle" | "loading" | "done"` в `switch`.

<details>
<summary>Solution</summary>

После трёх `case` добавь `default: return assertNever(status)`, где `assertNever(value: never): never` бросает ошибку.

</details>

## Remember

```text
never → impossible value
void → no useful return value
exhaustiveness → unhandled case cannot be never
```

## Related topics

- [Unions](#/s/typescript/01-foundation/unions)
- [Exhaustive checking](#/s/typescript/02-narrowing/exhaustive-checking)
- [Conditional types](#/s/typescript/04-advanced-types/conditional-types)
