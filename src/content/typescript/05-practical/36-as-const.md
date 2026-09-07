---
title: as const
titleRu: Утверждение as const
slug: as-const
section: practical
order: 36
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - literals
prerequisites:
  - literal-types
  - type-level-typeof
---

# as const

## TL;DR

`as const` сохраняет максимально узкие literal types и делает свойства/массивы readonly на уровне типов. Это удобно для runtime-констант, из которых затем выводятся unions и discriminated data.

## Mental model

```text
value as const → no widening + readonly literal structure
```

Assertion влияет только на статический тип и не вызывает `Object.freeze`.

## Core idea

- Primitive literals не расширяются.
- Object properties становятся readonly.
- Array literal становится readonly tuple.
- Применяется к literal expression, а не к произвольному вычислению.

## Example 1 — Basic

```ts
const request = {
  method: "GET",
  retry: 2,
} as const;

// method: "GET", retry: 2
```

Без assertion свойства обычно были бы `string` и `number`.

## Example 2 — Real-world

```ts
const roles = ["admin", "editor", "viewer"] as const;
type Role = (typeof roles)[number];

function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}
```

Один readonly список создаёт runtime-проверку и compile-time union.

## Example 3 — Important nuance

```ts
const config = { nested: { enabled: true } } as const;
config.nested.enabled = false; // Error through this type
```

Readonly глубокий для literal-структуры типа, но сам JavaScript-объект не заморожен.

## Common mistake

```ts
// problematic
const port = Number(env.PORT) as const;

// better
const port = Number(env.PORT);
```

`as const` нельзя использовать для придания точности динамическому числу; результат вычисления всё равно `number`.

## Interview answer

> **What does `as const` do?**

`as const` prevents literal widening and gives object properties and array elements readonly literal types. An array becomes a readonly tuple, which makes it easy to derive a union with `(typeof values)[number]`. The assertion is compile-time only: it does not freeze the object or validate data at runtime.

## Interview follow-ups

- How is `as const` different from `const`?
- Does it provide runtime immutability?
- How do you derive a union from a const array?

## Recall

- Что происходит с array literal?
- Почему `const object` недостаточно для literal properties?
- Замораживает ли assertion объект?

## Mini challenge

Создай readonly список статусов и выведи из него тип `Status`.

<details>
<summary>Solution</summary>

```ts
const statuses = ["draft", "published", "archived"] as const;
type Status = (typeof statuses)[number];
```

</details>

## Remember

```text
as const → preserve literals
array → readonly tuple
compile-time readonly ≠ Object.freeze
```

## Related topics

- [Literal types](#/s/typescript/01-foundation/literal-types)
- [Type-level typeof](#/s/typescript/03-generics/type-level-typeof)
- [satisfies](#/s/typescript/05-practical/satisfies)
