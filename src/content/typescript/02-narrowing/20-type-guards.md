---
title: Type Guards
titleRu: Пользовательские проверки типов
slug: type-guards
section: narrowing
order: 20
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - type-guards
prerequisites:
  - unknown
  - control-flow-analysis
---

# Type Guards

## TL;DR

Custom type guard — функция, возвращающая type predicate `value is T`. Она переиспользует runtime-проверку и сообщает компилятору, какой тип доказан в true-ветке; корректность predicate остаётся ответственностью автора.

## Mental model

```text
runtime boolean + `value is T` → reusable narrowing rule
```

Predicate не генерирует проверку — он описывает смысл написанного boolean-кода.

## Core idea

- Параметр в predicate должен быть параметром функции.
- Guard обязан реально проверять свойства, которыми затем пользуется код.
- `asserts value is T` подходит функциям, которые бросают ошибку.
- Guard — не полноценный schema validator с подробными ошибками.

> **Interview note**

Лживый predicate так же опасен, как type assertion: компилятор доверяет реализации.

## Example 1 — Basic

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}

const strings = values.filter(isString); // string[]
```

Predicate сохраняется в сигнатуре callback и сужает результат `filter`.

## Example 2 — Real-world

```ts
function isUser(value: unknown): value is User {
  return typeof value === "object"
    && value !== null
    && "id" in value
    && typeof value.id === "string"
    && "email" in value
    && typeof value.email === "string";
}
```

Проверяются и наличие, и типы полей внешнего объекта.

## Example 3 — Important nuance

```ts
function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) throw new Error("Invalid user");
}

assertUser(payload);
payload.email; // User
```

Assertion function сужает последующий flow без boolean-ветки.

## Common mistake

```ts
// problematic
function isUser(value: unknown): value is User {
  return Boolean(value);
}

// better
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value;
}
```

Predicate должен доказывать обещанную форму, иначе ошибка проявится в runtime.

## Interview answer

> **What is a user-defined type guard?**

A user-defined type guard is a function whose return type is a predicate such as `value is User`. TypeScript uses a true result to narrow the original argument. The function still contains ordinary runtime checks, and the compiler trusts the predicate, so its implementation must validate every property the application relies on. Assertion functions use `asserts` and throw instead of returning false.

## Interview follow-ups

- How is a type predicate different from a cast?
- What does `asserts value is T` mean?
- Can a guard narrow values passed to `filter`?

## Recall

- Какую связь сообщает `value is T`?
- Почему guard может быть небезопасным?
- Когда assertion function удобнее boolean guard?

## Mini challenge

Напиши guard для `string[]`, начиная с `unknown`.

<details>
<summary>Solution</summary>

```ts
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
```

</details>

## Remember

```text
value is T → reusable narrowing
predicate must tell the truth
asserts → throw on invalid value
```

## Related topics

- [Unknown](#/s/typescript/01-foundation/unknown)
- [Control-flow analysis](#/s/typescript/02-narrowing/control-flow-analysis)
- [Discriminated unions](#/s/typescript/02-narrowing/discriminated-unions)
