---
title: Mapped Types
titleRu: Отображаемые типы
slug: mapped-types
section: advanced-types
order: 27
difficulty: advanced
estimatedMinutes: 6
tags:
  - typescript
  - mapped-types
prerequisites:
  - keyof
  - indexed-access-types
---

# Mapped Types

## TL;DR

Mapped type проходит по union ключей и создаёт новое свойство для каждого ключа. Он системно меняет optional/readonly-модификаторы, типы значений и даже имена ключей.

## Mental model

```text
[K in keyof T] → type-level loop over keys
```

На каждой итерации доступны ключ `K` и исходное значение `T[K]`.

## Core idea

- Базовая форма: `{ [K in Keys]: Value }`.
- `?`, `readonly`, `-?`, `-readonly` меняют modifiers.
- `as` remaps или отбрасывает ключи.
- Результат вычисляется только компилятором.

## Example 1 — Basic

```ts
type Flags<T> = {
  [K in keyof T]: boolean;
};

type UserFlags = Flags<User>;
```

Каждое поле `User` превращается в boolean-флаг.

## Example 2 — Real-world

```ts
type Patch<T> = {
  [K in keyof T]?: T[K];
};

function updateUser(id: string, patch: Patch<User>) {}
```

Patch сохраняет тип каждого поля, делая его необязательным.

## Example 3 — Important nuance

```ts
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};
```

Key remapping строит новый API из существующей модели.

## Common mistake

```ts
// problematic
type Optional<T> = { [K in keyof T]: T[K] | undefined };

// better
type Optional<T> = { [K in keyof T]?: T[K] };
```

Union с `undefined` всё ещё требует присутствия ключа; `?` разрешает ключ пропустить.

## Interview answer

> **What is a mapped type?**

A mapped type iterates over a union of property keys and produces a property for each key. It can reuse `T[K]`, add or remove optional and readonly modifiers, and remap names with an `as` clause. Utility types such as `Partial`, `Required`, and `Readonly` are built from this idea, keeping transformations synchronized with the source type.

## Interview follow-ups

- How do you remove an optional modifier?
- What is key remapping?
- How is a mapped type different from an index signature?

## Recall

- Что представляет `K` внутри mapped type?
- Чем optional property отличается от `T | undefined`?
- Как отбросить ключ при remapping?

## Mini challenge

Создай `NullableFields<T>`, добавляющий `null` к каждому значению.

<details>
<summary>Solution</summary>

```ts
type NullableFields<T> = { [K in keyof T]: T[K] | null };
```

</details>

## Remember

```text
[K in keyof T] → iterate keys
T[K] → preserve value relationship
as → remap keys
```

## Related topics

- [keyof](#/s/typescript/03-generics/keyof)
- [Indexed access types](#/s/typescript/03-generics/indexed-access-types)
- [Utility types](#/s/typescript/04-advanced-types/utility-types)
