---
title: Distributive Conditional Types
titleRu: Распределяемые условные типы
slug: distributive-conditional-types
section: advanced-types
order: 30
difficulty: advanced
estimatedMinutes: 6
tags:
  - typescript
  - conditional-types
prerequisites:
  - conditional-types
  - infer
---

# Distributive Conditional Types

## TL;DR

Conditional type с «голым» generic-параметром слева от `extends` применяется отдельно к каждому участнику union. Оборачивание обеих сторон в tuple отключает распределение и проверяет union целиком.

## Mental model

```text
F<A | B> → F<A> | F<B>
```

Это map/filter по union на уровне типов.

## Core idea

- Распределяется форма `T extends U ? X : Y`.
- `never` удаляется из итогового union.
- `[T] extends [U]` проверяет union как единое целое.
- Поведение полезно, но может неожиданно расширить результат.

## Example 1 — Basic

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type Result = ToArray<string | number>;
// string[] | number[]
```

Каждый участник был преобразован отдельно.

## Example 2 — Real-world

```ts
type EventsWithPayload<T> = T extends { payload: unknown } ? T : never;

type PayloadEvents = EventsWithPayload<CreatedEvent | PingEvent | DeletedEvent>;
```

Варианты без `payload` превращаются в `never` и исчезают.

## Example 3 — Important nuance

```ts
type ToArrayTogether<T> = [T] extends [unknown] ? T[] : never;
type Together = ToArrayTogether<string | number>;
// (string | number)[]
```

Tuple wrapper выключает распределение.

## Common mistake

```ts
// problematic: expects (string | number)[]
type Values = ToArray<string | number>;

// better
type Values = ToArrayTogether<string | number>;
```

Сначала реши, нужно преобразовать members или union целиком.

## Interview answer

> **What makes a conditional type distributive?**

A conditional type distributes when the checked side is a naked type parameter, as in `T extends U ? X : Y`. If `T` is a union, TypeScript evaluates the condition for each member and unions the results. This supports filtering with `never`. Wrapping both sides in single-element tuples, `[T] extends [U]`, disables distribution.

## Interview follow-ups

- Why does `never` filter union members?
- What is a naked type parameter?
- When is non-distributive behavior preferable?

## Recall

- Какая форма запускает distributivity?
- Как проверить union целиком?
- Почему `never` исчезает из результата?

## Mini challenge

Создай `NonNullableValue<T>`, удаляющий `null | undefined` distributively.

<details>
<summary>Solution</summary>

```ts
type NonNullableValue<T> = T extends null | undefined ? never : T;
```

</details>

## Remember

```text
naked T → distribute
never → filter member
[T] → treat union as one type
```

## Related topics

- [Conditional types](#/s/typescript/04-advanced-types/conditional-types)
- [infer](#/s/typescript/04-advanced-types/infer)
- [Utility types](#/s/typescript/04-advanced-types/utility-types)
