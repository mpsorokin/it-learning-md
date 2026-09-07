---
title: Unions
titleRu: Объединения типов
slug: unions
section: foundation
order: 6
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - unions
prerequisites:
  - type-annotations
---

# Unions

## TL;DR

Union `A | B` означает, что значение соответствует одному из перечисленных типов. До проверки TypeScript разрешает только операции, безопасные для каждого участника union.

## Mental model

```text
A | B → A или B
до narrowing → только общие возможности
```

Union описывает набор допустимых состояний, а narrowing выясняет текущее.

## Core idea

- Union объединяет типы, а не их свойства.
- Общие методы доступны сразу; специфичные — после проверки.
- Литеральные union хорошо моделируют конечные состояния.
- Union объектов становится особенно удобным с общим discriminant-полем.

## Example 1 — Basic

```ts
function printId(id: string | number) {
  if (typeof id === "string") {
    console.log(id.toUpperCase());
  } else {
    console.log(id.toFixed(0));
  }
}
```

Проверка делит union на конкретные ветви.

## Example 2 — Real-world

```ts
type ApiResult =
  | { ok: true; data: User }
  | { ok: false; error: string };

function message(result: ApiResult) {
  return result.ok ? result.data.email : result.error;
}
```

Невозможное состояние «ошибка вместе с data» нельзя создать.

## Common mistake

```ts
// problematic
function length(value: string | string[]) {
  return value.trim().length;
}

// better
function length(value: string | string[]) {
  return typeof value === "string" ? value.trim().length : value.length;
}
```

Метод `trim` существует не у всех участников union. Сначала сузь тип.

## Interview answer

> **What is a union type in TypeScript?**

A union type represents a value that can be one of several types. Before narrowing, TypeScript only permits members that are safe for every union constituent. Unions are useful for finite states, nullable values, and success-or-error results. With a shared literal discriminant, they also let the compiler verify state-specific properties and exhaustive handling.

## Interview follow-ups

- Why are only common members accessible on a union?
- How do discriminated unions improve object unions?
- What is the difference between a union and an intersection?

## Recall

- Почему union не объединяет доступные свойства?
- Как смоделировать success и error без необязательных полей?
- Что должно произойти перед вызовом специфичного метода?

## Mini challenge

Исправь функцию, чтобы она принимала `Date | string` и всегда возвращала ISO-строку.

<details>
<summary>Solution</summary>

```ts
function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
```

</details>

## Remember

```text
A | B → одно из допустимых состояний
до narrowing → только общее
state objects → discriminated union
```

## Related topics

- [Literal types](#/s/typescript/01-foundation/literal-types)
- [typeof narrowing](#/s/typescript/02-narrowing/typeof-narrowing)
- [Discriminated unions](#/s/typescript/02-narrowing/discriminated-unions)
