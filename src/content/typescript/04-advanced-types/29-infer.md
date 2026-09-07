---
title: infer
titleRu: Оператор infer
slug: infer
section: advanced-types
order: 29
difficulty: advanced
estimatedMinutes: 6
tags:
  - typescript
  - infer
prerequisites:
  - conditional-types
---

# infer

## TL;DR

`infer` объявляет временную переменную типа внутри pattern conditional type. Вместо ручного индексирования он извлекает часть совпавшей структуры: return type, element type, resolved Promise value.

## Mental model

```text
T extends Pattern<infer X> ? X : fallback
                  ↑ extract this part
```

Переменная доступна только в ветках conditional type.

## Core idea

- `infer` используется в правой части `extends`.
- Структурный pattern определяет извлекаемую позицию.
- Несколько `infer` могут получить несколько частей.
- Built-in `ReturnType`, `Parameters`, `Awaited` используют похожий принцип.

## Example 1 — Basic

```ts
type ElementOf<T> = T extends readonly (infer Item)[] ? Item : never;
type ProductItem = ElementOf<Product[]>; // Product
```

`Item` появляется из позиции элемента массива.

## Example 2 — Real-world

```ts
type AsyncResult<T> = T extends (...args: never[]) => Promise<infer Result>
  ? Result
  : never;

type LoadedUser = AsyncResult<typeof loadUser>; // User
```

Из сигнатуры loader извлекается resolved payload.

## Example 3 — Important nuance

```ts
type First<T> = T extends readonly [infer Head, ...unknown[]] ? Head : never;
type Id = First<[string, number]>; // string
```

Pattern tuple может извлекать отдельные позиции.

## Common mistake

```ts
// problematic
type Unwrap<T> = infer Value;

// better
type Unwrap<T> = T extends Promise<infer Value> ? Value : T;
```

`infer` имеет смысл только внутри pattern conditional type.

## Interview answer

> **What does `infer` do in TypeScript?**

`infer` introduces a type variable while matching a type against a pattern in a conditional type. It lets the compiler extract a component such as an array element, function return type, tuple head, or Promise value. The inferred variable is scoped to the conditional branches, and the surrounding pattern determines exactly which part is captured.

## Interview follow-ups

- Where can an inferred variable be used?
- How would you implement a simplified `ReturnType`?
- What happens when the pattern does not match?

## Recall

- Где синтаксически разрешён `infer`?
- Как pattern определяет извлекаемую часть?
- Чем `infer` лучше ручного доступа к сложной структуре?

## Mini challenge

Извлеки первый параметр функции или верни `never`.

<details>
<summary>Solution</summary>

```ts
type FirstParameter<T> = T extends (first: infer P, ...args: never[]) => unknown ? P : never;
```

</details>

## Remember

```text
infer → capture part of a matched type
pattern decides extraction
no match → fallback branch
```

## Related topics

- [Conditional types](#/s/typescript/04-advanced-types/conditional-types)
- [Distributive conditional types](#/s/typescript/04-advanced-types/distributive-conditional-types)
- [Utility types](#/s/typescript/04-advanced-types/utility-types)
