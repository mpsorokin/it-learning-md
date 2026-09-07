---
title: Utility Types
titleRu: Встроенные utility types
slug: utility-types
section: advanced-types
order: 32
difficulty: intermediate
estimatedMinutes: 6
tags:
  - typescript
  - utility-types
prerequisites:
  - mapped-types
  - conditional-types
  - infer
---

# Utility Types

## TL;DR

Utility types — встроенные generic-преобразования для распространённых задач: менять modifiers, выбирать поля, работать с unions и извлекать сигнатуры. Они строят тип из источника и уменьшают ручное дублирование.

## Mental model

```text
source type → utility transformation → derived type
```

Исходная модель остаётся единственным источником истины.

## Core idea

- `Partial`, `Required`, `Readonly` меняют modifiers.
- `Pick`, `Omit`, `Record` формируют объектные структуры.
- `Exclude`, `Extract`, `NonNullable` фильтруют unions.
- `Parameters`, `ReturnType`, `Awaited` извлекают связанные типы.

## Example 1 — Basic

```ts
type UserPatch = Partial<User>;
type UserCard = Pick<User, "id" | "email">;
type NewUser = Omit<User, "id">;
```

Изменение полей `User` автоматически отражается в derived types.

## Example 2 — Real-world

```ts
type Role = "admin" | "editor" | "viewer";
type AccessMatrix = Record<Role, readonly Permission[]>;

const access: AccessMatrix = {
  admin: ["users.write"],
  editor: ["posts.write"],
  viewer: ["posts.read"],
};
```

`Record` требует запись для каждой роли.

## Example 3 — Important nuance

```ts
async function loadUser(): Promise<User> { /* ... */ }

type Loader = typeof loadUser;
type Loaded = Awaited<ReturnType<Loader>>; // User
```

Композиция utilities сохраняет связь с реальной функцией.

## Common mistake

```ts
// problematic
type Update = Partial<User>; // id can now be changed

// better
type Update = Partial<Omit<User, "id">>;
```

Utility не знает бизнес-правил; сначала выбери допустимые поля, затем меняй modifiers.

## Interview answer

> **What are TypeScript utility types?**

Utility types are built-in generic type transformations for common operations. Mapped-type utilities such as `Partial`, `Readonly`, `Pick`, and `Omit` reshape object types; conditional utilities such as `Exclude` and `Extract` filter unions; `Parameters`, `ReturnType`, and `Awaited` derive types from functions and promises. They reduce duplication but do not encode business rules automatically.

## Interview follow-ups

- How is `Pick` different from `Omit`?
- What does `Record<K, V>` guarantee?
- How would you unwrap an async return type?

## Recall

- Какие utilities меняют modifiers?
- Почему `Partial<User>` может быть слишком широким patch?
- Как извлечь resolved return type?

## Mini challenge

Создай тип публичного пользователя без `passwordHash`, только для чтения.

<details>
<summary>Solution</summary>

```ts
type PublicUser = Readonly<Omit<User, "passwordHash">>;
```

</details>

## Remember

```text
utilities → derive, do not duplicate
compose small transformations
business rules still need explicit field selection
```

## Related topics

- [Mapped types](#/s/typescript/04-advanced-types/mapped-types)
- [Conditional types](#/s/typescript/04-advanced-types/conditional-types)
- [infer](#/s/typescript/04-advanced-types/infer)
