---
title: Function Overloads
titleRu: Перегрузки функций
slug: function-overloads
section: practical
order: 33
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - functions
prerequisites:
  - unions
  - generics
---

# Function Overloads

## TL;DR

Overload signatures описывают несколько допустимых способов вызова одной реализации. Они нужны, когда тип результата зависит от формы аргументов и эту связь неудобно выразить простым union или generic.

## Mental model

```text
public call signatures
        ↓
one compatible implementation
```

Caller видит overloads, но не implementation signature.

## Core idea

- Overload signatures идут перед реализацией и не имеют body.
- Реализация должна быть совместима со всеми overloads.
- Более специфичные overloads ставятся раньше.
- Union обычно проще, если результат от варианта не меняется.

## Example 1 — Basic

```ts
function parse(value: string): number;
function parse(value: number): string;
function parse(value: string | number): string | number {
  return typeof value === "string" ? Number(value) : String(value);
}
```

Каждый вызов получает точный результат.

## Example 2 — Real-world

```ts
function findUser(id: string): Promise<User | null>;
function findUser(ids: string[]): Promise<User[]>;
async function findUser(input: string | string[]) {
  return Array.isArray(input)
    ? repository.findMany(input)
    : repository.findOne(input);
}
```

Single и batch API разделены на уровне вызова.

## Common mistake

```ts
// problematic
function len(value: string): number;
function len(value: string[]) { return value.length; }

// better
function len(value: string): number;
function len(value: string[]): number;
function len(value: string | string[]) { return value.length; }
```

Implementation должна принимать все публичные варианты, но сама не становится overload для caller-а.

## Interview answer

> **When should you use function overloads?**

I use overloads when a function has a small set of distinct call shapes and the return type depends on the selected shape. The overload signatures form the public API, while one broader implementation handles all cases. If callers do not gain a more precise result, a union parameter is usually simpler; for scalable type relationships, a generic may be better.

## Interview follow-ups

- Can callers use the implementation signature?
- Does overload order matter?
- When is a generic preferable?

## Recall

- Какие сигнатуры видит caller?
- Почему реализация должна быть шире overloads?
- Когда достаточно union parameter?

## Mini challenge

Добавь overloads для `format(Date): string` и `format(number): string`.

<details>
<summary>Solution</summary>

```ts
function format(value: Date): string;
function format(value: number): string;
function format(value: Date | number): string {
  return value instanceof Date ? value.toISOString() : value.toFixed(2);
}
```

</details>

## Remember

```text
overloads → precise call shapes
implementation → handles every overload
same result for union → prefer union
```

## Related topics

- [Unions](#/s/typescript/01-foundation/unions)
- [Generics](#/s/typescript/03-generics/generics)
- [Conditional types](#/s/typescript/04-advanced-types/conditional-types)
