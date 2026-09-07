---
title: Discriminated Unions
titleRu: Дискриминированные объединения
slug: discriminated-unions
section: narrowing
order: 18
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - unions
prerequisites:
  - literal-types
  - control-flow-analysis
---

# Discriminated Unions

## TL;DR

Discriminated union — union объектов с общим литеральным полем, которое однозначно определяет форму. Такая модель делает недопустимые состояния непредставимыми и даёт точное narrowing.

## Mental model

```text
kind: "loading" | "success" | "error"
           ↓
      выбирает форму
```

Каждое состояние хранит только данные, которые в нём действительно существуют.

## Core idea

- Discriminant присутствует во всех вариантах с разными literal values.
- Проверка discriminant сужает весь объект.
- Необязательные поля хуже выражают взаимоисключающие состояния.
- Добавление варианта можно связать с exhaustive checking.

> **Interview note**

Главная польза не только в narrowing, а в невозможности создать противоречивое состояние.

## Example 1 — Basic

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number };

function area(shape: Shape) {
  return shape.kind === "circle"
    ? Math.PI * shape.radius ** 2
    : shape.size ** 2;
}
```

`kind` связывает значение с нужным набором полей.

## Example 2 — Real-world

```ts
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

Нельзя прочитать `data` до success или создать loading с устаревшей ошибкой.

## Example 3 — Important nuance

```ts
const { status } = state;
if (status === "success") {
  console.log(state.data);
}
```

Современный TypeScript умеет связывать destructured discriminant с исходным объектом, пока связь не разрушена изменением.

## Common mistake

```ts
// problematic
type State = { loading: boolean; data?: User; error?: Error };

// better
type State =
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };
```

Первый тип допускает одновременно `loading`, `data` и `error`.

## Interview answer

> **What is a discriminated union?**

A discriminated union is a union of object types sharing a property whose value is a different literal in each member. Checking that property narrows the entire object to the matching member. It is an effective way to model state machines and success-or-error results because each state carries exactly its valid data and impossible combinations cannot be constructed.

## Interview follow-ups

- What makes a good discriminant?
- Why are optional fields weaker for state modeling?
- How do you enforce exhaustive handling?

## Recall

- Какие требования есть к discriminant-полю?
- Как union исключает противоречивые состояния?
- Какие данные принадлежат loading-state?

## Mini challenge

Смоделируй результат платежа с состояниями `approved` и `declined`, где причины есть только у отказа.

<details>
<summary>Solution</summary>

```ts
type PaymentResult =
  | { status: "approved"; transactionId: string }
  | { status: "declined"; reason: string };
```

</details>

## Remember

```text
shared literal field → discriminant
one state → one valid shape
new variant → exhaustive error
```

## Related topics

- [Literal types](#/s/typescript/01-foundation/literal-types)
- [Control-flow analysis](#/s/typescript/02-narrowing/control-flow-analysis)
- [Exhaustive checking](#/s/typescript/02-narrowing/exhaustive-checking)
