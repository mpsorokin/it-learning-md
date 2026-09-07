---
title: Excess Property Checking
titleRu: Проверка лишних свойств
slug: excess-property-checking
section: practical
order: 35
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - objects
prerequisites:
  - structural-typing
---

# Excess Property Checking

## TL;DR

Fresh object literal получает дополнительную проверку неизвестных свойств при присваивании целевому типу. Переменная с той же структурой может пройти обычную structural compatibility, поэтому это защита от опечаток, а не правило «никаких лишних полей».

## Mental model

```text
fresh literal + target type → typo check
existing variable → structural check
```

Разница зависит от контекста выражения, а не от runtime-объекта.

## Core idea

- Проверка срабатывает для свежих literals в assignment и arguments.
- Известные поля должны быть корректны в любом случае.
- Перенос в переменную может убрать excess check.
- `satisfies` проверяет literal, сохраняя его точный тип.

## Example 1 — Basic

```ts
interface Options { timeout: number }

const options: Options = {
  timeout: 1000,
  tiemout: 2000, // Error: unknown property
};
```

Проверка ловит вероятную опечатку.

## Example 2 — Real-world

```ts
function connect(options: Options) {}

const config = { timeout: 1000, retries: 3 };
connect(config); // allowed
```

Функции нужны обязательные возможности, а дополнительные данные переменной не мешают.

## Example 3 — Important nuance

```ts
const config = {
  timeout: 1000,
  retries: 3,
} satisfies Options; // Error for retries if Options is closed here
```

`satisfies` удобен, когда literal должен быть проверен напрямую.

## Common mistake

```ts
// problematic
const options = { timeout: 1000, tiemout: 2000 };
connect(options); // typo may escape excess check

// better
const options = { timeout: 1000, tiemout: 2000 } satisfies Options;
```

Не обходи ошибку промежуточной переменной; исправь контракт или опечатку.

## Interview answer

> **What is excess property checking?**

Excess property checking is an additional check applied to fresh object literals when TypeScript knows a target object type. It catches likely typos and unsupported options. It is not exact-object typing: an existing variable with additional members may still be structurally assignable. `satisfies` is useful when I want to validate a literal while preserving its inferred type.

## Interview follow-ups

- What makes an object literal fresh?
- Why can assigning through a variable change the result?
- Does TypeScript support exact object types by default?

## Recall

- Какую проблему решает excess check?
- Почему переменная с extra field может пройти?
- Как проверить literal без widening?

## Mini challenge

Найди опечатку `cacheTimout` при создании config, сохранив literal inference.

<details>
<summary>Solution</summary>

Используй `{ cacheTimout: 1000 } satisfies Config`; compiler укажет неизвестное поле, после чего исправь его на `cacheTimeout`.

</details>

## Remember

```text
fresh literal → excess property check
variable → structural compatibility
satisfies → validate without replacing inferred type
```

## Related topics

- [Structural typing](#/s/typescript/05-practical/structural-typing)
- [satisfies](#/s/typescript/05-practical/satisfies)
- [Object types](#/s/typescript/01-foundation/object-types)
