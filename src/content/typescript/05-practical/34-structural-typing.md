---
title: Structural Typing
titleRu: Структурная типизация
slug: structural-typing
section: practical
order: 34
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - structural-typing
prerequisites:
  - object-types
  - interfaces
---

# Structural Typing

## TL;DR

TypeScript сравнивает типы по доступной структуре, а не по объявленному имени. Значение с нужными полями совместимо с контрактом, даже если оно было создано независимо.

## Mental model

```text
compatible shape → compatible type
```

Имена interfaces помогают людям, но сами не создают номинальную идентичность.

## Core idea

- Дополнительные свойства обычно не мешают присваиванию.
- Проверяется доступная публичная структура.
- Классы с private/protected members получают ограниченную номинальность.
- Branding создаёт искусственное различие одинаковых primitives.

## Example 1 — Basic

```ts
interface Named { name: string }

const product = { id: "p1", name: "Keyboard", price: 80 };
function printName(value: Named) {}

printName(product);
```

`product` подходит благодаря полю `name`.

## Example 2 — Real-world

```ts
interface Clock { now(): Date }

function expire(clock: Clock) {
  return clock.now().getTime() + 60_000;
}

expire({ now: () => new Date() });
```

Dependency можно заменить маленьким test double без inheritance.

## Example 3 — Important nuance

```ts
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };
```

Brand отличает одинаковые runtime primitives только на compile time.

## Common mistake

```ts
// problematic
class User { constructor(public id: string) {} }
const user: User = { id: "u1" }; // allowed

// better
// Treat class type as a shape, or add runtime construction/validation explicitly.
```

Аннотация классом не гарантирует вызов конструктора и наличие runtime-прототипа.

## Interview answer

> **What is structural typing?**

Structural typing means compatibility is based on members rather than declared names. An independently created object can satisfy an interface when it has the required shape, which supports flexible composition and lightweight test doubles. It also means aliases do not create identity and class annotations do not prove runtime construction. Private members and explicit brands can introduce nominal-like restrictions.

## Interview follow-ups

- Why can a plain object satisfy a class type?
- How do private members affect compatibility?
- What problem does branding solve?

## Recall

- Почему независимо созданный объект подходит interface?
- Что structural typing упрощает в тестах?
- Когда нужна номинальная идентичность?

## Mini challenge

Определи минимальный interface для сервиса, которому нужен только метод `send(message: string)`.

<details>
<summary>Solution</summary>

```ts
interface MessageSender {
  send(message: string): void;
}
```

</details>

## Remember

```text
shape, not name → compatibility
extra members → usually allowed
brand/private → nominal-like restriction
```

## Related topics

- [Object types](#/s/typescript/01-foundation/object-types)
- [Interfaces](#/s/typescript/01-foundation/interfaces)
- [Excess property checking](#/s/typescript/05-practical/excess-property-checking)
