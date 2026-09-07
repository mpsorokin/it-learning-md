---
title: keyof
titleRu: Оператор keyof
slug: keyof
section: generics
order: 24
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - keyof
prerequisites:
  - object-types
  - generic-constraints
---

# keyof

## TL;DR

`keyof T` создаёт union известных ключей типа `T`. В generic API он связывает строковый выбор с реальной формой объекта и предотвращает обращения к несуществующим свойствам.

## Mental model

```text
{ id: string; active: boolean }
             ↓ keyof
       "id" | "active"
```

Это type-level операция; объект в runtime не обходится.

## Core idea

- Результат обычно union string literals.
- Числовые и symbol keys тоже могут входить в результат.
- У string index signature результат часто `string | number`.
- `Object.keys` возвращает `string[]`, потому что runtime-объект может иметь больше свойств.

## Example 1 — Basic

```ts
interface User {
  id: string;
  active: boolean;
}

type UserKey = keyof User; // "id" | "active"
```

Изменение `User` автоматически обновляет union ключей.

## Example 2 — Real-world

```ts
function select<T, K extends keyof T>(row: T, columns: K[]): Pick<T, K> {
  return Object.fromEntries(columns.map((key) => [key, row[key]])) as Pick<T, K>;
}

const card = select(user, ["id", "active"]);
```

Caller не может запросить неизвестную колонку, а результат знает выбранные поля.

## Common mistake

```ts
// problematic
function read<T>(value: T, key: string) {
  return value[key];
}

// better
function read<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}
```

`string` шире набора реальных ключей.

## Interview answer

> **What does `keyof` do in TypeScript?**

`keyof T` produces a union of the known property keys of `T`. It is commonly combined with generics, such as `K extends keyof T`, to ensure a key argument exists on an object. Paired with indexed access `T[K]`, it also preserves the exact value type associated with the selected key.

## Interview follow-ups

- Why can `keyof` include `number` or `symbol`?
- Why is `Object.keys` not always `(keyof T)[]`?
- How does `keyof` interact with index signatures?

## Recall

- Какой union создаёт `keyof User`?
- Почему `string` слишком широк для accessor?
- Какая операция возвращает тип значения ключа?

## Mini challenge

Ограничь `sortBy` только ключами `Product`.

<details>
<summary>Solution</summary>

```ts
function sortBy<K extends keyof Product>(items: Product[], key: K): Product[] {
  return [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}
```

</details>

## Remember

```text
keyof T → known keys of T
K extends keyof T → valid key
T[K] → value at that key
```

## Related topics

- [Multiple type parameters](#/s/typescript/03-generics/multiple-type-parameters)
- [Indexed access types](#/s/typescript/03-generics/indexed-access-types)
- [Mapped types](#/s/typescript/04-advanced-types/mapped-types)
