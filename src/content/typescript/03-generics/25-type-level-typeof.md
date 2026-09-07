---
title: Type-level typeof
titleRu: Оператор typeof в типах
slug: type-level-typeof
section: generics
order: 25
difficulty: intermediate
estimatedMinutes: 4
tags:
  - typescript
  - typeof
prerequisites:
  - type-inference
---

# Type-level typeof

## TL;DR

В позиции типа `typeof value` получает статический тип существующей переменной или свойства. Это позволяет вывести runtime-константу один раз и построить от неё тип без дублирования формы.

## Mental model

```text
const value = ...
type Value = typeof value
```

Runtime `typeof` возвращает строку, type-level `typeof` возвращает TypeScript-тип.

## Core idea

- Используется только в type context.
- Обычно применяется к идентификатору или доступу к свойству.
- С `as const` сохраняет literals и readonly-форму.
- Часто комбинируется с `keyof` и indexed access.

## Example 1 — Basic

```ts
const defaultConfig = {
  retries: 3,
  mode: "safe",
};

type Config = typeof defaultConfig;
```

Тип остаётся синхронизирован с константой.

## Example 2 — Real-world

```ts
const permissions = ["users.read", "users.write"] as const;

type Permission = (typeof permissions)[number];
// "users.read" | "users.write"
```

Один список служит runtime-источником и compile-time union.

## Common mistake

```ts
// problematic
type Result = typeof loadUser();

// better
type Loader = typeof loadUser;
type Result = ReturnType<Loader>;
```

В type query нельзя выполнить произвольный вызов. Сначала получи тип функции.

## Interview answer

> **What is type-level `typeof`?**

In a type position, `typeof` captures the static TypeScript type of an existing value. It differs from JavaScript's runtime `typeof`, which returns strings such as `"string"`. Type queries reduce duplication when a value is the source of truth, and combining them with `as const`, `keyof`, or indexed access can derive precise literal unions.

## Interview follow-ups

- How does type-level `typeof` differ from runtime `typeof`?
- Why combine it with `as const`?
- Can a type query contain a function call?

## Recall

- Что возвращают две версии `typeof`?
- Как получить union элементов const-array?
- Почему type query уменьшает дублирование?

## Mini challenge

Получи тип значения объекта `routes` и union его ключей.

<details>
<summary>Solution</summary>

```ts
const routes = { home: "/", users: "/users" } as const;
type Routes = typeof routes;
type RouteName = keyof Routes;
```

</details>

## Remember

```text
runtime typeof → string category
type-level typeof → static type
as const + typeof → precise source of truth
```

## Related topics

- [Type inference](#/s/typescript/01-foundation/type-inference)
- [keyof](#/s/typescript/03-generics/keyof)
- [as const](#/s/typescript/05-practical/as-const)
