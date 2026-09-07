---
title: Conditional Types
titleRu: Условные типы
slug: conditional-types
section: advanced-types
order: 28
difficulty: advanced
estimatedMinutes: 6
tags:
  - typescript
  - conditional-types
prerequisites:
  - generic-constraints
  - indexed-access-types
---

# Conditional Types

## TL;DR

Conditional type выбирает один из типов по проверке assignability: `T extends U ? X : Y`. Он позволяет описать связь input-output и строить type-level преобразования без overload для каждого случая.

## Mental model

```text
T extends U ? X : Y
          ↓
     type-level if
```

Проверяется совместимость типов, а не runtime-условие.

## Core idea

- True branch может использовать знание, что `T` совместим с `U`.
- С generic `T` результат откладывается до подстановки типа.
- `never` часто исключает неподходящие варианты.
- Naked type parameter распределяет условие по union.

## Example 1 — Basic

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<"ready">; // true
type B = IsString<number>;  // false
```

Результаты — literal types `true` и `false`, не значения.

## Example 2 — Real-world

```ts
type ApiPayload<T> = T extends { data: infer Data } ? Data : never;

type UserPayload = ApiPayload<{ data: User; requestId: string }>;
// User
```

Тип извлекает payload из общей envelope-формы.

## Example 3 — Important nuance

```ts
type Message<T> = T extends Error ? string : T;

type Result = Message<Error | number>; // string | number
```

Generic conditional распределился по двум union members.

## Common mistake

```ts
// problematic
type Flatten<T> = T extends any[] ? T[0] : T;

// better
type Flatten<T> = T extends readonly (infer Item)[] ? Item : T;
```

`T[0]` неточно выражает элемент и пропускает readonly arrays; `infer` описывает намерение.

## Interview answer

> **What is a conditional type?**

A conditional type selects one type or another based on assignability, using `T extends U ? X : Y`. It is the type-system equivalent of branching and often models different output types for different generic inputs. When the checked type is a naked type parameter, conditional types distribute over unions unless distribution is deliberately disabled.

## Interview follow-ups

- When is a conditional type deferred?
- Why can `never` filter a union?
- How do you disable distributivity?

## Recall

- Что проверяет `extends` в условии?
- Когда conditional распределяется по union?
- Для чего false-ветка возвращает `never`?

## Mini challenge

Создай тип `ElementOf<T>`, извлекающий элемент readonly-массива, иначе возвращающий `T`.

<details>
<summary>Solution</summary>

```ts
type ElementOf<T> = T extends readonly (infer Item)[] ? Item : T;
```

</details>

## Remember

```text
T extends U ? X : Y → type-level branch
never → remove a branch
naked T → distributive over unions
```

## Related topics

- [infer](#/s/typescript/04-advanced-types/infer)
- [Distributive conditional types](#/s/typescript/04-advanced-types/distributive-conditional-types)
- [Utility types](#/s/typescript/04-advanced-types/utility-types)
