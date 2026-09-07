---
title: Generics
titleRu: Дженерики
slug: generics
section: generics
order: 21
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - generics
prerequisites:
  - type-inference
---

# Generics

## TL;DR

Generic связывает несколько позиций одним параметром типа вместо потери информации через `any`. TypeScript обычно выводит конкретный `T` из аргументов вызова.

## Mental model

```text
input T → output T
```

Generic полезен, когда один и тот же неизвестный тип должен сохраняться или преобразовываться согласованно.

## Core idea

- `T` — параметр типа, а не runtime-значение.
- Аргументы типа чаще выводятся автоматически.
- Generic должен выражать связь как минимум между двумя позициями.
- Реализация может использовать только операции, известные для unconstrained `T`.

## Example 1 — Basic

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const name = first(["Ana", "Lee"]); // string | undefined
```

Тип элемента проходит из аргумента в результат.

## Example 2 — Real-world

```ts
interface ApiResponse<T> {
  data: T;
  requestId: string;
}

async function getUser(): Promise<ApiResponse<User>> {
  return api.get("/user");
}
```

Одинаковая envelope-форма сохраняет конкретный payload.

## Common mistake

```ts
// problematic
function log<T>(value: T): void {}

// better
function log(value: unknown): void {}
```

Если `T` встречается один раз, он не связывает типы и обычно ничего не даёт.

## Interview answer

> **What problem do generics solve in TypeScript?**

Generics let reusable code preserve relationships between types without choosing a concrete type or falling back to `any`. For example, a generic function can return the same element type it receives, and a generic container can retain its payload type. Type arguments are often inferred, while constraints describe the minimum capabilities the implementation needs.

## Interview follow-ups

- When can TypeScript infer a type argument?
- When is a generic parameter unnecessary?
- How are generics represented at runtime?

## Recall

- Как generic сохраняет тип результата?
- Почему `any` теряет связь input-output?
- Когда `T` в одной позиции бессмыслен?

## Mini challenge

Реализуй `last<T>`, возвращающий последний элемент или `undefined`.

<details>
<summary>Solution</summary>

```ts
function last<T>(items: readonly T[]): T | undefined {
  return items.at(-1);
}
```

</details>

## Remember

```text
generic → type relationship
T inferred at call site
one occurrence of T → question its value
```

## Related topics

- [Generic constraints](#/s/typescript/03-generics/generic-constraints)
- [Multiple type parameters](#/s/typescript/03-generics/multiple-type-parameters)
- [Utility types](#/s/typescript/04-advanced-types/utility-types)
