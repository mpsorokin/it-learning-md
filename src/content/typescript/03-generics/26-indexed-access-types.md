---
title: Indexed Access Types
titleRu: Индексированные типы доступа
slug: indexed-access-types
section: generics
order: 26
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - indexed-access
prerequisites:
  - keyof
  - type-level-typeof
---

# Indexed Access Types

## TL;DR

`T[K]` получает тип свойства `K` у типа `T`. Если `K` — union ключей, результатом становится union соответствующих значений; `[number]` извлекает тип элемента массива или tuple.

## Mental model

```text
T[K] → lookup in a type
```

Это аналог `object[key]`, но полностью на уровне типов.

## Core idea

- `K` должен быть допустимым ключом `T`.
- `T[keyof T]` создаёт union всех типов значений.
- `ArrayType[number]` получает element type.
- Optional property добавляет `undefined` в результат lookup.

## Example 1 — Basic

```ts
interface User {
  id: string;
  age: number;
  nickname?: string;
}

type Id = User["id"]; // string
type Identity = User["id" | "age"]; // string | number
```

Lookup переиспользует исходное определение поля.

## Example 2 — Real-world

```ts
const roles = ["admin", "editor", "viewer"] as const;
type Role = (typeof roles)[number];

function grant(role: Role) {}
```

Runtime-array и тип остаются одним источником истины.

## Example 3 — Important nuance

```ts
type Nickname = User["nickname"];
// string | undefined
```

Optional modifier является частью свойства и отражается в lookup.

## Common mistake

```ts
// problematic
type Value<T, K extends string> = T[K];

// better
type Value<T, K extends keyof T> = T[K];
```

Произвольная строка не гарантирует существование ключа.

## Interview answer

> **What is an indexed access type?**

An indexed access type looks up a property type using syntax like `T[K]`. The key can be a literal or a union, in which case the result is the union of matching value types. Combined with `K extends keyof T`, it powers type-safe property accessors; using `[number]` extracts the element type of arrays and tuples.

## Interview follow-ups

- What does `T[keyof T]` produce?
- How do optional properties affect indexed access?
- Why does `[number]` extract an array element?

## Recall

- Как извлечь тип элемента const-array?
- Что вернёт lookup по union ключей?
- Почему optional поле добавляет `undefined`?

## Mini challenge

Получи тип элемента `Promise<User[]>` после await, используя `Awaited` и indexed access.

<details>
<summary>Solution</summary>

```ts
type Users = Awaited<Promise<User[]>>;
type UserItem = Users[number];
```

</details>

## Remember

```text
T[K] → property type
T[keyof T] → union of values
T[number] → array element type
```

## Related topics

- [keyof](#/s/typescript/03-generics/keyof)
- [Mapped types](#/s/typescript/04-advanced-types/mapped-types)
- [Utility types](#/s/typescript/04-advanced-types/utility-types)
