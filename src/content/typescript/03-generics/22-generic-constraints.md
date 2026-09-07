---
title: Generic Constraints
titleRu: Ограничения дженериков
slug: generic-constraints
section: generics
order: 22
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - generics
prerequisites:
  - generics
---

# Generic Constraints

## TL;DR

Constraint `T extends U` ограничивает допустимые аргументы типа и разрешает реализации использовать возможности `U`. При этом результат сохраняет точный конкретный `T`, а не превращается в constraint.

## Mental model

```text
T extends U → T неизвестен, но минимум соответствует U
```

Constraint задаёт необходимую способность, а не готовый результат.

## Core idea

- `extends` в generic означает ограничение assignability.
- Выбирай минимальную форму, нужную реализации.
- Возвращаемый `T` сохраняет дополнительные свойства caller-а.
- Constraint не создаёт runtime-проверку.

## Example 1 — Basic

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
```

Функция работает со строками и массивами, сохраняя их конкретный тип.

## Example 2 — Real-world

```ts
interface Entity { id: string }

function indexById<T extends Entity>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}
```

Любая domain entity подходит, а map хранит исходную расширенную форму.

## Common mistake

```ts
// problematic
function getId<T extends object>(value: T) {
  return value.id;
}

// better
function getId<T extends { id: string }>(value: T) {
  return value.id;
}
```

`object` не обещает поле `id`; constraint должен описывать конкретную потребность.

## Interview answer

> **What is a generic constraint?**

A generic constraint limits which types may replace a type parameter and exposes a minimum known shape inside the implementation. `T extends { id: string }` accepts richer object types but guarantees that `id` exists. Unlike simply accepting the constraint type, returning `T` preserves the caller's additional properties and more precise type information.

## Interview follow-ups

- Does a constraint validate values at runtime?
- Why prefer the smallest useful constraint?
- How is a constraint different from a default type argument?

## Recall

- Какие операции доступны для constrained `T`?
- Почему результат остаётся `T`, а не `U`?
- Что не гарантирует constraint `object`?

## Mini challenge

Ограничь функцию `sortByCreatedAt` объектами с `createdAt: Date`.

<details>
<summary>Solution</summary>

```ts
function sortByCreatedAt<T extends { createdAt: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
```

</details>

## Remember

```text
constraint → minimum capability
T remains the caller's precise type
constraint ≠ runtime validation
```

## Related topics

- [Generics](#/s/typescript/03-generics/generics)
- [keyof](#/s/typescript/03-generics/keyof)
- [Structural typing](#/s/typescript/05-practical/structural-typing)
