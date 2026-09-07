---
title: Template Literal Types
titleRu: Шаблонные строковые типы
slug: template-literal-types
section: advanced-types
order: 31
difficulty: advanced
estimatedMinutes: 6
tags:
  - typescript
  - template-literals
prerequisites:
  - literal-types
  - mapped-types
---

# Template Literal Types

## TL;DR

Template literal types строят string literal unions из других literal types. Они полезны для event names, route keys и строковых протоколов, когда допустимые комбинации можно вывести из исходной модели.

## Mental model

```text
`${A}.${B}` → cartesian product of literal unions
```

Это compile-time генерация строк, а не runtime formatting.

## Core idea

- Интерполяция union создаёт все комбинации.
- `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize` меняют casing.
- В mapped type можно генерировать имена свойств.
- Слишком большие unions ухудшают читаемость и скорость compiler-а.

## Example 1 — Basic

```ts
type Entity = "user" | "order";
type Action = "created" | "deleted";
type EventName = `${Entity}.${Action}`;
```

`EventName` содержит четыре допустимые комбинации.

## Example 2 — Real-world

```ts
type ChangedEvents<T> = {
  [K in keyof T as `${string & K}Changed`]: (value: T[K]) => void;
};

type UserEvents = ChangedEvents<User>;
```

Имена handlers и payload выводятся из модели `User`.

## Example 3 — Important nuance

```ts
type Route = `/users/${string}`;

const valid: Route = "/users/u1";
const invalid: Route = "/orders/o1"; // Error
```

`string` внутри pattern допускает динамический сегмент, сохраняя prefix.

## Common mistake

```ts
// problematic
type EveryCombination = `${HugeUnionA}-${HugeUnionB}-${HugeUnionC}`;

// better
type Identifier = string & { readonly __brand: "Identifier" };
```

Не генерируй огромный union, если строку проще валидировать на runtime и брендировать.

## Interview answer

> **What are template literal types used for?**

Template literal types create string literal types by interpolating other literal types. When interpolated positions are unions, TypeScript generates their combinations. They are useful for typed event names, route patterns, and mapped property names, especially when derived from an existing model. I avoid enormous generated unions because they become hard to inspect and can slow type checking.

## Interview follow-ups

- What happens when two unions are interpolated?
- How do intrinsic string manipulation types work?
- When is runtime validation still necessary?

## Recall

- Как строится набор комбинаций?
- Как mapped type генерирует handler names?
- Почему шаблонный тип не проверяет runtime input сам по себе?

## Mini challenge

Создай тип permission `${Resource}:${Action}` для `user | order` и `read | write`.

<details>
<summary>Solution</summary>

```ts
type Resource = "user" | "order";
type Action = "read" | "write";
type Permission = `${Resource}:${Action}`;
```

</details>

## Remember

```text
template literal type → derive strings
union interpolation → combinations
huge combinations → prefer simpler model
```

## Related topics

- [Literal types](#/s/typescript/01-foundation/literal-types)
- [Mapped types](#/s/typescript/04-advanced-types/mapped-types)
- [as const](#/s/typescript/05-practical/as-const)
