---
title: Multiple Type Parameters
titleRu: Несколько параметров типа
slug: multiple-type-parameters
section: generics
order: 23
difficulty: intermediate
estimatedMinutes: 4
tags:
  - typescript
  - generics
prerequisites:
  - generic-constraints
---

# Multiple Type Parameters

## TL;DR

Несколько параметров типа выражают связи между разными типами: например, объектом и его ключом или success и error payload. Каждый параметр должен добавлять информацию, а constraints фиксируют отношения между ними.

## Mental model

```text
T = source type
K = choice constrained by T
```

Имена `TKey`, `TValue` полезнее одиночных букв в сложных сигнатурах.

## Core idea

- Параметры выводятся слева направо из аргументов.
- `K extends keyof T` связывает ключ с объектом.
- Default type parameter идёт после обязательных.
- Слишком много независимых параметров делает API сложным.

## Example 1 — Basic

```ts
function pair<TLeft, TRight>(left: TLeft, right: TRight): [TLeft, TRight] {
  return [left, right];
}

const entry = pair("status", 200); // [string, number]
```

Каждая позиция сохраняет свой тип.

## Example 2 — Real-world

```ts
function getProperty<T, K extends keyof T>(object: T, key: K): T[K] {
  return object[key];
}

const email = getProperty(user, "email");
```

Ключ ограничен реальными полями, а результат зависит от выбранного ключа.

## Common mistake

```ts
// problematic
function get<T, K extends string>(object: T, key: K) {
  return object[key];
}

// better
function get<T, K extends keyof T>(object: T, key: K): T[K] {
  return object[key];
}
```

Обычная строка не гарантирует существование свойства.

## Interview answer

> **When do you need multiple generic parameters?**

I use multiple type parameters when an operation must preserve more than one distinct type or express a relationship between them. A common example is `K extends keyof T`, where `T` is an object and `K` must be one of its keys. Each parameter should affect inputs or outputs; otherwise it adds complexity without improving safety.

## Interview follow-ups

- How does inference choose multiple type arguments?
- Why constrain one parameter by another?
- When should generic parameter names be descriptive?

## Recall

- Как `K` связан с `T` в property accessor?
- Почему `K extends string` недостаточно?
- Когда второй параметр типа лишний?

## Mini challenge

Реализуй `mapValue<T, R>(value, mapper)` с результатом `R`.

<details>
<summary>Solution</summary>

```ts
function mapValue<T, R>(value: T, mapper: (value: T) => R): R {
  return mapper(value);
}
```

</details>

## Remember

```text
multiple parameters → multiple preserved types
constraint → relationship between parameters
unused parameter → remove it
```

## Related topics

- [Generic constraints](#/s/typescript/03-generics/generic-constraints)
- [keyof](#/s/typescript/03-generics/keyof)
- [Indexed access types](#/s/typescript/03-generics/indexed-access-types)
