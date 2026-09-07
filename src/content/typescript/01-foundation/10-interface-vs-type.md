---
title: interface vs type
titleRu: interface и type
slug: interface-vs-type
section: foundation
order: 10
difficulty: beginner
estimatedMinutes: 5
tags:
  - typescript
  - interfaces
prerequisites:
  - interfaces
  - type-aliases
---

# interface vs type

## TL;DR

И `interface`, и `type` хорошо описывают объектные формы. Выбирай `interface` для открытых расширяемых контрактов, а `type` — для union, tuple, primitives и вычисляемых типов; внутри приложения важнее последовательность команды.

## Mental model

```text
interface → open object contract
type → alias for any type expression
```

Большая часть объектного кода может быть записана обоими способами.

## Core idea

- Оба поддерживают свойства, методы, generics и композицию.
- Interface расширяется через `extends`, alias — обычно через intersection.
- Только interface поддерживает declaration merging.
- Только alias напрямую представляет union или tuple.

> **Interview note**

Не отвечай «interface всегда лучше для объектов». Назови реальные различия и проектное соглашение.

## Example 1 — Basic

```ts
interface User {
  id: string;
}

type UserWithRole = User & { role: "admin" | "member" };
```

Обе конструкции могут безопасно участвовать в одной модели.

## Example 2 — Real-world

```ts
interface PluginRegistry {
  logger: LoggerPlugin;
}

interface PluginRegistry {
  metrics: MetricsPlugin;
}
```

После merging registry содержит оба свойства — полезно для контролируемого расширения библиотек.

## Example 3 — Important nuance

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };
```

Interface не может напрямую выразить такой union.

## Common mistake

```ts
// problematic
interface Config { url: string }
interface Config { timeout: number } // accidental merge

// better
type Config = { url: string; timeout: number };
```

Случайное повторное имя interface тихо меняет контракт. Для закрытой внутренней модели alias может быть предсказуемее.

## Interview answer

> **What is the difference between `interface` and `type`?**

Both can describe object shapes and support generics. Interfaces are open: they support declaration merging and are naturally extended with `extends`, which suits augmentable public contracts. Type aliases can name any type expression, including unions, tuples, primitives, and conditional types, but cannot be reopened. For ordinary internal object models, I follow the project's convention unless one of these differences matters.

## Interview follow-ups

- Can a type alias extend an interface?
- When is declaration merging desirable?
- Which one can represent a conditional type?

## Recall

- Какое различие важно для library augmentation?
- Почему union требует `type`?
- В чём риск случайного declaration merging?

## Mini challenge

Выбери конструкцию для результата API с ветками success/error и объясни выбор.

<details>
<summary>Solution</summary>

Используй `type`, потому что корневая модель является union двух объектных форм.

</details>

## Remember

```text
interface → open, mergeable object shape
type → any type expression
обычный объект → follow project convention
```

## Related topics

- [Interfaces](#/s/typescript/01-foundation/interfaces)
- [Type aliases](#/s/typescript/01-foundation/type-aliases)
- [Discriminated unions](#/s/typescript/02-narrowing/discriminated-unions)
