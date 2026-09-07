---
title: instanceof Narrowing
titleRu: Сужение через instanceof
slug: instanceof-narrowing
section: narrowing
order: 16
difficulty: intermediate
estimatedMinutes: 4
tags:
  - typescript
  - narrowing
prerequisites:
  - unions
---

# instanceof Narrowing

## TL;DR

`value instanceof Constructor` проверяет цепочку прототипов и сужает значение до типа экземпляра класса. Он подходит для реальных runtime-конструкторов, но не для interfaces и type aliases, которые стираются при компиляции.

## Mental model

```text
runtime prototype check → instance type
```

Если справа нет JavaScript-конструктора, проверять нечего.

## Core idea

- Работает с классами и встроенными `Date`, `Error`, `Map`.
- Не работает с interface: у него нет runtime-значения.
- Объекты после JSON parsing теряют пользовательские прототипы.
- Разные realms могут иметь разные копии конструктора.

## Example 1 — Basic

```ts
function format(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
```

В true-ветке доступны методы `Date`.

## Example 2 — Real-world

```ts
function errorStatus(error: unknown): number {
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ValidationError) return 400;
  return 500;
}
```

Иерархия domain errors превращается в HTTP-ответы.

## Common mistake

```ts
// problematic
if (payload instanceof UserDto) {}
// UserDto is an interface

// better
if (isUserDto(payload)) {}
```

Для структурных данных нужен validator или custom type guard.

## Interview answer

> **When can TypeScript use `instanceof` for narrowing?**

TypeScript narrows with `instanceof` when the right-hand side is a runtime constructor, such as a class, `Date`, or `Error`. It checks the prototype chain, not merely the object's properties. Interfaces and type aliases cannot be used because they are erased. It is also unreliable for plain JSON objects that were never constructed by the class.

## Interview follow-ups

- Why cannot an interface be used with `instanceof`?
- What happens after serializing and parsing a class instance?
- How do multiple JavaScript realms affect `instanceof`?

## Recall

- Что именно проверяет `instanceof`?
- Почему parsed JSON не является экземпляром DTO-класса?
- Когда custom guard лучше класса?

## Mini challenge

Напиши функцию, возвращающую message для `Error | string`.

<details>
<summary>Solution</summary>

```ts
function message(value: Error | string): string {
  return value instanceof Error ? value.message : value;
}
```

</details>

## Remember

```text
instanceof → prototype chain
interface/type → no runtime value
plain JSON → structural validation
```

## Related topics

- [typeof narrowing](#/s/typescript/02-narrowing/typeof-narrowing)
- [Type guards](#/s/typescript/02-narrowing/type-guards)
- [Structural typing](#/s/typescript/05-practical/structural-typing)
