---
title: Interfaces
titleRu: Интерфейсы
slug: interfaces
section: foundation
order: 8
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - interfaces
prerequisites:
  - object-types
---

# Interfaces

## TL;DR

`interface` задаёт именованный объектный контракт, который можно расширять и реализовывать классом. Объявления с одинаковым именем объединяются, поэтому interface особенно удобен для расширяемых публичных API.

## Mental model

```text
interface → открытая именованная форма объекта
```

Он существует только для проверки типов и исчезает из JavaScript.

## Core idea

- `extends` наследует свойства одного или нескольких interfaces.
- `implements` проверяет публичную форму класса.
- Declaration merging объединяет объявления одного имени.
- Совместимость всё равно структурная: явно писать `implements` не обязательно для обычного объекта.

## Example 1 — Basic

```ts
interface User {
  id: string;
  email: string;
  active?: boolean;
}

const user: User = { id: "u1", email: "dev@example.com" };
```

Interface делает повторно используемую форму именованной.

## Example 2 — Real-world

```ts
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}

class UserRepository implements Repository<User> {
  async findById(id: string) { return database.users.find(id); }
  async save(user: User) { return database.users.save(user); }
}
```

Класс проверяется против контракта без влияния на runtime.

## Common mistake

```ts
// problematic
interface Entity extends string {}

// better
type EntityId = string;
```

Interface описывает объектную форму и не заменяет alias для primitive или union.

## Interview answer

> **What is an interface in TypeScript?**

An interface names an object shape and can be extended by other interfaces or implemented by classes. Interfaces participate in declaration merging, which makes them useful for public APIs designed for augmentation. They are erased during compilation, and compatibility remains structural, so an object can satisfy an interface without explicitly declaring that relationship.

## Interview follow-ups

- What is declaration merging?
- Does `implements` add runtime behavior?
- Can an interface represent a union?

## Recall

- Что именно проверяет `implements`?
- Почему interface называют открытым контрактом?
- Когда declaration merging полезен и когда опасен?

## Mini challenge

Создай `AuditedEntity`, расширяющий `Entity` полями `createdAt` и `updatedAt` типа `Date`.

<details>
<summary>Solution</summary>

```ts
interface AuditedEntity extends Entity {
  createdAt: Date;
  updatedAt: Date;
}
```

</details>

## Remember

```text
interface → object contract
extends → compose interfaces
same name → declaration merging
```

## Related topics

- [Object types](#/s/typescript/01-foundation/object-types)
- [Type aliases](#/s/typescript/01-foundation/type-aliases)
- [interface vs type](#/s/typescript/01-foundation/interface-vs-type)
