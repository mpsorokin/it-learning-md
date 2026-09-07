---
title: Type Inference
titleRu: Вывод типов
slug: type-inference
section: foundation
order: 1
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - inference
prerequisites: []
---

# Type Inference

## TL;DR

TypeScript часто вычисляет тип сам по значению и контексту. Явная аннотация нужна не везде: хороший вывод типов сокращает шум, не ослабляя проверку.

## Mental model

```text
значение + контекст → наиболее полезный тип
```

Компилятор идёт от известного к неизвестному: от литерала, возвращаемого значения или ожидаемого типа к типу выражения.

## Core idea

- `let` обычно расширяет строковый литерал до `string`, а `const` сохраняет литеральный тип.
- Тип возвращаемого значения выводится из всех ветвей функции.
- Контекст задаёт тип параметров callback.
- Вывод не проверяет бизнес-смысл: корректные аннотации на границах всё ещё важны.

## Example 1 — Basic

```ts
let status = "draft";   // string
const role = "admin";   // "admin"
const attempts = 3;     // 3
```

Изменяемая переменная должна принимать другие строки, а неизменяемая константа может сохранить точное значение.

## Example 2 — Real-world

```ts
const users = [{ id: 1, name: "Marta" }];

const names = users.map((user) => user.name);
// user: { id: number; name: string }
// names: string[]
```

Тип параметра `user` приходит из сигнатуры `map`, поэтому повторять его не нужно.

## Common mistake

```ts
// problematic
const total: number = orders.reduce((sum: number, order: Order) => sum + order.amount, 0);

// better
const total = orders.reduce((sum, order) => sum + order.amount, 0);
```

Лишние аннотации затрудняют чтение и могут разойтись с реальным типом. Аннотируй публичную границу, а локальные очевидные значения оставляй выводу.

## Interview answer

> **When should you rely on type inference in TypeScript?**

I rely on inference for local variables, callbacks, and straightforward return values because the compiler already has enough context. I add annotations at public boundaries such as exported functions, DTOs, and variables whose intended type is wider than their initializer. This keeps code concise while making contracts explicit and prevents accidental API changes during refactoring.

## Interview follow-ups

- How does `const` affect inferred literal types?
- What is contextual typing?
- Why annotate exported function return types?

## Recall

- Почему `let status = "draft"` обычно имеет тип `string`?
- Откуда callback получает тип параметра?
- На каких границах аннотация полезнее вывода?

## Mini challenge

Предскажи тип `result`:

```ts
function normalize(active: boolean) {
  return active ? "enabled" : null;
}

const result = normalize(true);
```

<details>
<summary>Solution</summary>

Тип `result` — `string | null`: возвращаемые ветви объединяются, а строковый литерал расширяется для обычной функции.

</details>

## Remember

```text
очевидное локальное значение → inference
публичный контракт → annotation
const → чаще сохраняет literal type
```

## Related topics

- [Type annotations](#/s/typescript/01-foundation/type-annotations)
- [Literal types](#/s/typescript/01-foundation/literal-types)
- [Type-level typeof](#/s/typescript/03-generics/type-level-typeof)
