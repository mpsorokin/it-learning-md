---
title: satisfies
titleRu: Оператор satisfies
slug: satisfies
section: practical
order: 37
difficulty: intermediate
estimatedMinutes: 6
tags:
  - typescript
  - satisfies
prerequisites:
  - type-annotations
  - as-const
---

# satisfies

## TL;DR

`expression satisfies Type` проверяет совместимость выражения с контрактом, но сохраняет выведенный тип самого выражения. Это сочетает проверку полноты с точной информацией о конкретных ключах и литералах.

## Mental model

```text
annotation → check and use target type
satisfies → check, keep source type
```

Оператор не возвращает boolean и не выполняет runtime-валидацию.

## Core idea

- Ошибки формы показываются в месте объявления.
- Конкретные keys и value types остаются доступными.
- Вместе с `as const` сохраняет readonly literals.
- Не заменяет validator для внешних данных.

> **Interview note**

Главное отличие от `as Type`: assertion просит поверить, `satisfies` требует проверить.

## Example 1 — Basic

```ts
type Palette = Record<"primary" | "danger", string>;

const palette = {
  primary: "#3366ff",
  danger: "#cc2233",
} satisfies Palette;

palette.primary.toUpperCase();
```

Полнота ключей проверена, конкретные свойства сохранены.

## Example 2 — Real-world

```ts
type Route = { path: string; secure: boolean };

const routes = {
  profile: { path: "/profile", secure: true },
  login: { path: "/login", secure: false },
} as const satisfies Record<string, Route>;
```

Доступны точные route names и literal flags, но каждая запись соответствует `Route`.

## Example 3 — Important nuance

```ts
const annotated: Record<string, Route> = routes;
// keyof typeof annotated is string

type RouteName = keyof typeof routes;
// "profile" | "login"
```

Аннотация расширяет набор ключей, а `satisfies` его сохраняет.

## Common mistake

```ts
// problematic
const config = externalValue satisfies Config;

// better
const config = parseConfig(externalValue);
```

`satisfies` проверяет известный статический тип выражения, а не содержимое из сети.

## Interview answer

> **How is `satisfies` different from a type annotation or assertion?**

`satisfies` checks that an expression is assignable to a target type while preserving the expression's inferred type. An annotation makes the variable use the annotated type, which can widen keys or values. An assertion tells the compiler to trust a relationship and may bypass useful checks. None of them validates unknown runtime data; that still requires parsing or a guard.

## Interview follow-ups

- Does `satisfies` return a boolean?
- Why combine `as const` with `satisfies`?
- Can it validate JSON at runtime?

## Recall

- Какой тип сохраняет `satisfies`?
- Чем он безопаснее assertion?
- Почему точные route keys не теряются?

## Mini challenge

Создай matrix для ролей `admin | viewer`, сохранив точные массивы permissions.

<details>
<summary>Solution</summary>

```ts
const access = {
  admin: ["read", "write"],
  viewer: ["read"],
} as const satisfies Record<"admin" | "viewer", readonly string[]>;
```

</details>

## Remember

```text
satisfies → validate and preserve inference
annotation → use target type
assertion → compiler trusts you
```

## Related topics

- [Type annotations](#/s/typescript/01-foundation/type-annotations)
- [as const](#/s/typescript/05-practical/as-const)
- [Excess property checking](#/s/typescript/05-practical/excess-property-checking)
