---
title: Type Aliases
titleRu: Псевдонимы типов
slug: type-aliases
section: foundation
order: 9
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - type-aliases
prerequisites:
  - object-types
  - unions
---

# Type Aliases

## TL;DR

`type` даёт имя любому типу: объекту, union, tuple, primitive или вычисляемому типу. Alias не создаёт новый номинальный тип — он лишь удобное имя существующей структуры.

## Mental model

```text
type Name = existing type expression
```

Подстановка имени мысленно возвращает исходное выражение.

## Core idea

- Alias может называть тип любого вида.
- Пересечение `A & B` комбинирует требования объектных типов.
- Alias может быть generic и строить семейство типов.
- Повторно объявить alias с тем же именем нельзя.

## Example 1 — Basic

```ts
type UserId = string;
type Status = "active" | "blocked";
type Coordinates = [number, number];
```

Имена добавляют смысл, но `UserId` остаётся совместим со `string`.

## Example 2 — Real-world

```ts
type ApiResponse<T> = {
  data: T;
  requestId: string;
};

type UserResponse = ApiResponse<User>;
```

Generic alias повторно использует одну форму для разных payload.

## Common mistake

```ts
// problematic
type UserId = string;
type OrderId = string;
const orderId: OrderId = userId; // allowed

// better
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };
```

Обычный alias не создаёт отдельную идентичность. Branding нужен только там, где смешение одинаковых primitives действительно опасно.

## Interview answer

> **Does a type alias create a new type?**

No. A type alias gives a reusable name to a type expression but does not create nominal identity. Two aliases with the same structure remain compatible under TypeScript's structural type system. Aliases are flexible because they can name unions, tuples, primitives, object shapes, and generic or computed types.

## Interview follow-ups

- Can a type alias be generic?
- How can you approximate nominal typing?
- Can a type alias be reopened?

## Recall

- Почему два alias для `string` совместимы?
- Какие виды типов может называть `type`?
- Чем intersection отличается от union?

## Mini challenge

Создай generic alias `Nullable<T>` и примени его к `User`.

<details>
<summary>Solution</summary>

```ts
type Nullable<T> = T | null;
type OptionalUser = Nullable<User>;
```

</details>

## Remember

```text
type alias → name for any type expression
alias ≠ nominal identity
generic alias → reusable type transformation
```

## Related topics

- [Interfaces](#/s/typescript/01-foundation/interfaces)
- [interface vs type](#/s/typescript/01-foundation/interface-vs-type)
- [Generics](#/s/typescript/03-generics/generics)
