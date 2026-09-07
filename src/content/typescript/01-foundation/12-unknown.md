---
title: unknown
titleRu: Тип unknown
slug: unknown
section: foundation
order: 12
difficulty: beginner
estimatedMinutes: 5
tags:
  - typescript
  - unknown
prerequisites:
  - any
  - unions
---

# unknown

## TL;DR

`unknown` принимает любое значение, но запрещает его использование до narrowing. Это безопасный тип для данных, входящих из JSON, storage, catch и сторонних систем.

## Mental model

```text
unknown
→ значение может быть любым
→ сначала проверь
→ затем используй
```

Неизвестность сохраняется, пока код не докажет конкретный тип.

## Core idea

- Любой тип присваивается в `unknown`.
- `unknown` нельзя присвоить конкретному типу без проверки.
- Разрешены только универсальные операции вроде сравнения.
- Narrowing через `typeof`, `instanceof` или type guard открывает безопасные операции.

> **Interview note**

Ключевая разница: `any` доверяет вызывающему коду, `unknown` требует доказательства.

## Example 1 — Basic

```ts
function uppercase(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.toUpperCase();
}
```

Внутри ветки TypeScript знает, что `value` — строка.

## Example 2 — Real-world

```ts
function parseConfig(raw: string): Config {
  const value: unknown = JSON.parse(raw);

  if (!isConfig(value)) {
    throw new Error("Invalid config");
  }
  return value;
}
```

Runtime-проверка превращает неизвестное значение в доверенный application type.

## Example 3 — Important nuance

```ts
let safe: unknown = "ready";
let text: string;

safe = text; // allowed
text = safe; // Error
```

Направление присваивания отражает необходимость проверки.

## Common mistake

```ts
// problematic
function errorMessage(error: unknown) {
  return error.message;
}

// better
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
```

В JavaScript бросить можно не только `Error`, поэтому catch-переменная справедливо неизвестна.

## Interview answer

> **What is the difference between `any` and `unknown`?**

Both can hold any value, but `any` disables most type checking while `unknown` preserves it. You can call methods or access properties on `any` immediately; with `unknown`, you must narrow or validate first. I use `unknown` at untrusted boundaries such as parsed JSON, caught errors, and external APIs, and reserve `any` for narrowly contained compatibility escape hatches.

## Interview follow-ups

- Can `unknown` be assigned to `string`?
- Which operations are allowed on `unknown`?
- How do type guards work with `unknown`?

## Recall

- Почему любое значение можно присвоить в `unknown`, но не наоборот?
- Какие проверки превращают `unknown` в полезный тип?
- Почему catch error лучше считать неизвестным?

## Mini challenge

Реализуй чтение числа из `unknown`, возвращая `null` для других значений.

<details>
<summary>Solution</summary>

```ts
function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
```

</details>

## Remember

```text
unknown → narrow before use
any → disables most checking
external boundary → unknown + validation
```

## Related topics

- [any](#/s/typescript/01-foundation/any)
- [typeof narrowing](#/s/typescript/02-narrowing/typeof-narrowing)
- [Type guards](#/s/typescript/02-narrowing/type-guards)
