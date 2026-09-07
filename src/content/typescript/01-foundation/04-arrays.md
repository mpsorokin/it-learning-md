---
title: Arrays
titleRu: Массивы
slug: arrays
section: foundation
order: 4
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - arrays
prerequisites:
  - object-types
---

# Arrays

## TL;DR

`T[]` описывает массив элементов одного типа `T`; `Array<T>` означает то же самое. Readonly-массив позволяет читать элементы, но запрещает изменяющие операции через данный контракт.

## Mental model

```text
T[] → любое количество значений T
```

Длина массива не входит в тип; если важны позиции и длина, нужна tuple.

## Core idea

- `string[]` и `Array<string>` эквивалентны.
- Union ставится в скобки: `(string | number)[]`.
- `readonly T[]` и `ReadonlyArray<T>` не имеют `push` или `splice`.
- Индексирование обычно даёт `T`; `noUncheckedIndexedAccess` добавляет `undefined`.

## Example 1 — Basic

```ts
const ids: string[] = ["u1", "u2"];
const values: Array<string | number> = ["ready", 200];
const first = ids[0];
```

Обе формы записи одинаковы; выбирай принятую в проекте.

## Example 2 — Real-world

```ts
function visibleProducts(products: readonly Product[]): Product[] {
  return products.filter((product) => product.isVisible);
}

const result = visibleProducts(catalog);
```

Readonly-вход показывает, что функция не должна менять переданную коллекцию.

## Common mistake

```ts
// problematic
const permissions = [];

// better
const permissions: Permission[] = [];
```

Для пустого массива контекста часто недостаточно или вывод оказывается слишком узким. Задай тип элемента на границе создания коллекции.

## Interview answer

> **What is the difference between an array and a readonly array in TypeScript?**

A regular `T[]` supports both reading and mutation. A `readonly T[]` exposes only non-mutating operations through that reference, so consumers cannot call `push`, `pop`, or assign an element. It is a compile-time contract rather than runtime immutability, and nested objects inside the array remain mutable unless they are also readonly.

## Interview follow-ups

- Are `T[]` and `Array<T>` equivalent?
- What does `noUncheckedIndexedAccess` change?
- Is a readonly array deeply immutable?

## Recall

- Когда нужен `(A | B)[]`, а не `A | B[]`?
- Почему readonly-массив полезен в параметре функции?
- Что TypeScript знает о длине обычного массива?

## Mini challenge

Исправь сигнатуру так, чтобы функция принимала readonly-массив и не меняла исходные данные:

```ts
function newest(items: Product[]) {
  return items.sort((a, b) => b.createdAt - a.createdAt)[0];
}
```

<details>
<summary>Solution</summary>

```ts
function newest(items: readonly Product[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt)[0];
}
```

</details>

## Remember

```text
T[] → homogeneous collection
readonly T[] → no mutation through this reference
fixed positions → tuple
```

## Related topics

- [Tuples](#/s/typescript/01-foundation/tuples)
- [Unions](#/s/typescript/01-foundation/unions)
- [Generics](#/s/typescript/03-generics/generics)
