---
title: Object Types
titleRu: Объектные типы
slug: object-types
section: foundation
order: 3
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - objects
prerequisites:
  - type-annotations
---

# Object Types

## TL;DR

Объектный тип описывает форму значения: имена свойств, их типы и обязательность. TypeScript проверяет совместимость по структуре, а не по имени класса или типа.

## Mental model

```text
object type = required shape
```

Значение подходит, если содержит как минимум нужные поля правильных типов.

## Core idea

- Свойство без `?` обязательно.
- `readonly` запрещает переназначение через этот тип, но не замораживает объект в runtime.
- Вложенные объекты получают собственную форму.
- `{}` означает любое non-nullish значение, а не «пустой объект».

## Example 1 — Basic

```ts
let product: {
  id: string;
  name: string;
  price?: number;
};

product = { id: "p1", name: "Keyboard" };
```

`price` можно пропустить, остальные поля обязательны.

## Example 2 — Real-world

```ts
type ApiResponse = {
  readonly requestId: string;
  data: {
    users: User[];
    nextCursor?: string;
  };
};
```

Тип отражает реальную вложенность ответа и отдельно отмечает необязательный cursor.

## Common mistake

```ts
// problematic
function save(config: {}) {}
save("production"); // allowed

// better
function save(config: Record<string, unknown>) {}
```

Тип `{}` принимает строки, числа и функции. Для словаря неизвестных значений точнее `Record<string, unknown>`.

## Interview answer

> **How does TypeScript check object types?**

TypeScript uses structural compatibility: a value is assignable when it has the required properties with compatible types. Extra properties are usually allowed, although fresh object literals receive an additional excess-property check. Optional and readonly modifiers affect how the object can be used through that type, but readonly does not freeze the runtime object.

## Interview follow-ups

- What does an optional property mean?
- Is `readonly` enforced at runtime?
- Why is `{}` rarely the right object type?

## Recall

- Чем объектный тип отличается от runtime-проверки?
- Почему `readonly` не делает глубокую заморозку?
- Какие значения принимает `{}`?

## Mini challenge

Опиши тип `Config` для обязательного `apiUrl`, необязательного `timeout` и неизменяемого `environment`.

<details>
<summary>Solution</summary>

```ts
type Config = {
  apiUrl: string;
  timeout?: number;
  readonly environment: "dev" | "prod";
};
```

</details>

## Remember

```text
object type → shape
? → property may be absent
readonly → compile-time write restriction
```

## Related topics

- [Interfaces](#/s/typescript/01-foundation/interfaces)
- [Type aliases](#/s/typescript/01-foundation/type-aliases)
- [Structural typing](#/s/typescript/05-practical/structural-typing)
