---
title: Literal Types
titleRu: Литеральные типы
slug: literal-types
section: foundation
order: 7
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - literals
prerequisites:
  - unions
---

# Literal Types

## TL;DR

Литеральный тип представляет конкретное значение: например, `"admin"` или `200`. Union литералов ограничивает поле небольшим набором допустимых значений и помогает моделировать состояния без enum.

## Mental model

```text
string → любая строка
"draft" → одна конкретная строка
```

Чем точнее тип, тем больше невозможных состояний отсекается компилятором.

## Core idea

- Литералами могут быть строки, числа и boolean.
- `const` сохраняет литерал переменной, но свойства объекта обычно расширяются.
- Union литералов даёт autocomplete и проверку опечаток.
- Литеральное поле часто служит discriminant.

## Example 1 — Basic

```ts
type HttpMethod = "GET" | "POST" | "PATCH";

function request(method: HttpMethod) {}

request("GET");
request("DELETE"); // Error
```

Контракт принимает только предусмотренные методы.

## Example 2 — Real-world

```ts
type JobStatus = "queued" | "running" | "completed" | "failed";

interface Job {
  id: string;
  status: JobStatus;
}
```

Состояние нельзя случайно записать как произвольную строку.

## Common mistake

```ts
// problematic
const options = { method: "GET" };
request(options.method); // string is too wide

// better
const options = { method: "GET" as const };
request(options.method);
```

Свойство изменяемого объекта расширяется до `string`. `as const` сохраняет конкретный литерал.

## Interview answer

> **What are literal types useful for?**

Literal types represent exact values rather than broad primitive categories. Combining them into unions models finite choices such as roles, statuses, or HTTP methods and gives callers autocomplete plus typo detection. Literal fields can also discriminate object unions, allowing control-flow analysis to select the correct state-specific properties.

## Interview follow-ups

- Why does an object property often widen to `string`?
- How does `as const` affect literal inference?
- When would you prefer a literal union over an enum?

## Recall

- Чем `"ready"` отличается от `string` как тип?
- Почему literal union удобен для статусов?
- Как сохранить литеральный тип свойства объекта?

## Mini challenge

Создай тип `LogLevel` из значений `debug`, `info`, `warn`, `error` и используй его в функции `log`.

<details>
<summary>Solution</summary>

```ts
type LogLevel = "debug" | "info" | "warn" | "error";
function log(level: LogLevel, message: string): void {}
```

</details>

## Remember

```text
literal type → exact value
literal union → finite choices
discriminant → literal property
```

## Related topics

- [Unions](#/s/typescript/01-foundation/unions)
- [Discriminated unions](#/s/typescript/02-narrowing/discriminated-unions)
- [as const](#/s/typescript/05-practical/as-const)
