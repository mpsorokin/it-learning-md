---
title: Tuples
titleRu: Кортежи
slug: tuples
section: foundation
order: 5
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - tuples
prerequisites:
  - arrays
---

# Tuples

## TL;DR

Tuple — массив с известной длиной и типом каждой позиции. Он полезен, когда позиция имеет устойчивый смысл; для расширяемых записей обычно понятнее объект.

## Mental model

```text
[string, number] → ровно две позиции с разными ролями
```

В отличие от `Array<string | number>`, порядок является частью контракта.

## Core idea

- `[A, B]` фиксирует позиции и минимальную длину.
- Позиции можно именовать: `[status: number, body: string]`.
- `?` делает хвостовой элемент необязательным, `...T[]` задаёт остаток.
- `readonly` защищает tuple от изменения через ссылку.

## Example 1 — Basic

```ts
type Point = readonly [x: number, y: number];

const origin: Point = [0, 0];
const x = origin[0]; // number
```

Имена `x` и `y` помогают редактору, но не существуют в runtime.

## Example 2 — Real-world

```ts
type QueryResult<T> = [rows: T[], total: number];

async function findUsers(): Promise<QueryResult<User>> {
  const rows = await repository.find();
  return [rows, rows.length];
}
```

Деструктуризация `[users, total]` сохраняет разные типы позиций.

## Common mistake

```ts
// problematic
type UserRecord = [string, string, boolean, number];

// better
interface UserRecord {
  id: string;
  email: string;
  active: boolean;
  loginCount: number;
}
```

Длинная tuple заставляет помнить значение каждого индекса. Объект лучше переносит изменения и сам документирует поля.

## Interview answer

> **How is a tuple different from an array in TypeScript?**

An array describes any number of elements sharing an element type. A tuple describes a fixed sequence where each position can have a different type and semantic label. Tuples work well for compact paired results and hooks, while objects are usually clearer when there are many fields or the structure may evolve.

## Interview follow-ups

- Can tuples have optional elements?
- What does a rest element mean in a tuple?
- When should a tuple be readonly?

## Recall

- Как tuple сохраняет связь позиции и типа?
- Когда объект читается лучше tuple?
- Существуют ли labels tuple в JavaScript?

## Mini challenge

Задай тип результата операции как readonly tuple: успешность, значение и необязательная ошибка.

<details>
<summary>Solution</summary>

```ts
type OperationResult<T> = readonly [ok: boolean, value: T, error?: string];
```

</details>

## Remember

```text
array → повторяющиеся элементы
tuple → фиксированные позиции
много ролей → предпочти object
```

## Related topics

- [Arrays](#/s/typescript/01-foundation/arrays)
- [Literal types](#/s/typescript/01-foundation/literal-types)
- [Multiple type parameters](#/s/typescript/03-generics/multiple-type-parameters)
