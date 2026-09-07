---
title: in Narrowing
titleRu: Сужение через in
slug: in-narrowing
section: narrowing
order: 15
difficulty: intermediate
estimatedMinutes: 4
tags:
  - typescript
  - narrowing
prerequisites:
  - object-types
  - unions
---

# in Narrowing

## TL;DR

Оператор `"property" in value` проверяет наличие свойства в объекте и сужает union по его форме. Он учитывает также унаследованные и необязательные свойства, поэтому не всегда разделяет ветки полностью.

## Mental model

```text
"key" in object → варианты, где key может существовать
```

Это runtime-проверка JavaScript, которую TypeScript использует как доказательство.

## Core idea

- Справа должен быть object, не `null` и не primitive.
- True-ветка сохраняет типы с обязательным или optional свойством.
- False-ветка также может сохранять тип с optional свойством.
- Для точной схемы внешних данных одной проверки свойства мало.

## Example 1 — Basic

```ts
type Account = { email: string } | { organizationId: string };

function label(account: Account) {
  return "email" in account ? account.email : account.organizationId;
}
```

Уникальное поле однозначно выбирает вариант union.

## Example 2 — Real-world

```ts
function handle(error: NetworkError | ValidationError) {
  if ("fields" in error) {
    return Object.keys(error.fields);
  }
  return [error.message];
}
```

Структурная проверка подходит объектам без общего discriminant.

## Common mistake

```ts
// problematic
if ("id" in value) return value.id;

// better
if (typeof value === "object" && value !== null && "id" in value) {
  return value.id;
}
```

При `unknown` сначала нужно доказать, что справа допустим объект.

## Interview answer

> **How does the `in` operator narrow types?**

The `in` operator performs a JavaScript property-existence check, and TypeScript keeps union members that may contain that property. It is useful for object unions with distinct fields. Optional properties can remain in both branches, and inherited properties also satisfy `in`, so for untrusted data I combine it with object checks and validation of the property's value type.

## Interview follow-ups

- How do optional properties affect `in` narrowing?
- Does `in` inspect inherited properties?
- Is `in` enough to validate API data?

## Recall

- Какие варианты остаются в true-ветке?
- Почему optional property может остаться в обеих ветках?
- Какие проверки нужны перед `in` для `unknown`?

## Mini challenge

Раздели `Cat | Dog` по уникальным методам `meow` и `bark`.

<details>
<summary>Solution</summary>

```ts
function speak(pet: Cat | Dog) {
  return "meow" in pet ? pet.meow() : pet.bark();
}
```

</details>

## Remember

```text
"key" in value → structural narrowing
optional key → may remain in both branches
unknown → prove object first
```

## Related topics

- [typeof narrowing](#/s/typescript/02-narrowing/typeof-narrowing)
- [Discriminated unions](#/s/typescript/02-narrowing/discriminated-unions)
- [Type guards](#/s/typescript/02-narrowing/type-guards)
