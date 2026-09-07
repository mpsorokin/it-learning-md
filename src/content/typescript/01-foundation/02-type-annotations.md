---
title: Type Annotations
titleRu: Аннотации типов
slug: type-annotations
section: foundation
order: 2
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - annotations
prerequisites:
  - type-inference
---

# Type Annotations

## TL;DR

Аннотация явно задаёт контракт там, где TypeScript не может его вывести или где намерение важнее текущего значения. Она проверяет код, но не преобразует данные во время выполнения.

## Mental model

```text
const value: ExpectedType = expression
             ↑ контракт для проверки
```

После компиляции аннотация исчезает; runtime получает обычный JavaScript.

## Core idea

- Аннотируются переменные, параметры, возвращаемые значения и свойства.
- Параметры функций без аннотации запрещены при `noImplicitAny`.
- Возвращаемый тип экспортируемой функции фиксирует публичный контракт.
- Аннотация не валидирует JSON, форму или ответ API.

## Example 1 — Basic

```ts
function formatPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}
```

Параметры требуют контракт, а возвращаемый тип документирует обещание функции.

## Example 2 — Real-world

```ts
interface CreateUserDto {
  email: string;
  role: "admin" | "member";
}

async function createUser(input: CreateUserDto): Promise<User> {
  return repository.insert(input);
}
```

Граница service слоя явно говорит, что принимает и что асинхронно возвращает.

## Common mistake

```ts
// problematic
const user = JSON.parse(payload) as User;

// better
const user: unknown = JSON.parse(payload);
if (!isUser(user)) throw new Error("Invalid user payload");
```

Аннотация или assertion не проверяет внешние данные. На runtime-границе нужна валидация.

## Interview answer

> **What is a type annotation in TypeScript?**

A type annotation explicitly states the type expected for a variable, parameter, property, or return value. The compiler uses it to check assignments and usage, then removes it from the emitted JavaScript. I use annotations for API boundaries and places where inference lacks context, but avoid repeating types that are already obvious from local values.

## Interview follow-ups

- Are annotations available at runtime?
- When is a return type annotation valuable?
- How does an annotation differ from a type assertion?

## Recall

- Почему аннотация не защищает от неверного JSON?
- Какие параметры требуют аннотаций при `noImplicitAny`?
- Где явный return type предотвращает случайные изменения API?

## Mini challenge

Добавь минимальные аннотации так, чтобы функция была совместима со strict mode:

```ts
function findUser(users, id) {
  return users.find((user) => user.id === id);
}
```

<details>
<summary>Solution</summary>

```ts
function findUser(users: User[], id: string): User | undefined {
  return users.find((user) => user.id === id);
}
```

</details>

## Remember

```text
annotation → compile-time contract
annotation ≠ runtime validation
public boundary → make intent explicit
```

## Related topics

- [Type inference](#/s/typescript/01-foundation/type-inference)
- [Unknown](#/s/typescript/01-foundation/unknown)
- [tsconfig and strict mode](#/s/typescript/05-practical/tsconfig-strict-mode)
