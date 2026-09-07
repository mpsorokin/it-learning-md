---
title: typeof Narrowing
titleRu: Сужение через typeof
slug: typeof-narrowing
section: narrowing
order: 14
difficulty: intermediate
estimatedMinutes: 4
tags:
  - typescript
  - narrowing
prerequisites:
  - unions
  - unknown
---

# typeof Narrowing

## TL;DR

Проверка `typeof value === "string"` сужает union до primitive-типа внутри соответствующей ветки. Это основной инструмент для `string`, `number`, `boolean`, `bigint`, `symbol`, `undefined` и `function`.

## Mental model

```text
runtime typeof check → smaller compile-time union
```

TypeScript связывает условие с дальнейшим control flow.

## Core idea

- Результаты `typeof` ограничены JavaScript-строками.
- `typeof null` равен `"object"` — нужна отдельная проверка.
- Отрицательная проверка сужает оставшиеся варианты.
- Проверка действует лишь там, где значение не могло измениться.

## Example 1 — Basic

```ts
function normalize(value: string | number): string {
  if (typeof value === "number") return value.toFixed(2);
  return value.trim();
}
```

После раннего return остаток автоматически становится `string`.

## Example 2 — Real-world

```ts
function readTimeout(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 5000;
}
```

Проверка безопасно обрабатывает конфигурацию из внешнего источника.

## Common mistake

```ts
// problematic
if (typeof value === "object") console.log(value.id);

// better
if (typeof value === "object" && value !== null && "id" in value) {
  console.log(value.id);
}
```

`null` тоже имеет runtime-тип `object`, а наличие свойства требует отдельного доказательства.

## Interview answer

> **How does `typeof` narrowing work in TypeScript?**

TypeScript recognizes JavaScript `typeof` checks and narrows a union within the matching control-flow branch. It works best for primitive types and functions. The important JavaScript caveat is that `typeof null` is `"object"`, so object checks normally also exclude `null` and may need an `in` check or a custom guard for the object's shape.

## Interview follow-ups

- What does `typeof null` return?
- Can `typeof` distinguish arrays from objects?
- Does an early return affect narrowing?

## Recall

- Какие primitive-типы различает `typeof`?
- Почему проверки `object` недостаточно?
- Что остаётся от union после отрицательной проверки?

## Mini challenge

Верни длину строки или массива, а для остальных `unknown` — ноль.

<details>
<summary>Solution</summary>

```ts
function size(value: unknown): number {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.length;
  return 0;
}
```

</details>

## Remember

```text
typeof → primitive narrowing
typeof null → "object"
early return → narrows the remainder
```

## Related topics

- [Unknown](#/s/typescript/01-foundation/unknown)
- [Control-flow analysis](#/s/typescript/02-narrowing/control-flow-analysis)
- [Type guards](#/s/typescript/02-narrowing/type-guards)
