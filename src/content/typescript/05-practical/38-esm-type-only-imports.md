---
title: ESM and Type-only Imports
titleRu: ESM и импорты только типов
slug: esm-type-only-imports
section: practical
order: 38
difficulty: intermediate
estimatedMinutes: 6
tags:
  - typescript
  - esm
prerequisites:
  - type-aliases
---

# ESM and Type-only Imports

## TL;DR

ESM различает runtime imports и TypeScript-типы, которые стираются. `import type` явно сообщает, что зависимость нужна только compiler-у, предотвращая случайные runtime imports и проблемы с module settings.

## Mental model

```text
import value → JavaScript dependency
import type → erased after checking
```

Один symbol может существовать только в type space, только в value space или в обоих.

## Core idea

- Interface и type alias не существуют в emitted JavaScript.
- Class существует как constructor value и instance type.
- `import { type User, createUser }` смешивает оба вида явно.
- `verbatimModuleSyntax` сохраняет value imports и требует точных намерений.

## Example 1 — Basic

```ts
import type { User } from "./user.js";
import { createUser } from "./user.js";

const user: User = createUser();
```

После compilation остаётся только import функции.

## Example 2 — Real-world

```ts
import { Injectable } from "@nestjs/common";
import type { UserRepository } from "./user.repository.js";

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}
}
```

Decorator нужен в runtime, interface repository — только для проверки.

## Example 3 — Important nuance

```ts
import type { User } from "./user.js";

new User(); // Error: cannot be used as a value
```

Даже если `User` экспортируется как class, type-only import скрывает value side.

## Common mistake

```ts
// problematic
import type { Injectable } from "@nestjs/common";
@Injectable()

// better
import { Injectable } from "@nestjs/common";
@Injectable()
```

Decorator вызывается в runtime, поэтому его import нельзя стереть.

## Interview answer

> **Why use type-only imports in TypeScript ESM projects?**

Type-only imports make it explicit that a dependency is needed solely for static checking and should be erased from emitted JavaScript. This avoids accidental runtime loading, clarifies side-effect behavior, and works predictably with settings such as `verbatimModuleSyntax`. Classes and decorators may need value imports because they exist at runtime, even when the same symbol is also used as a type.

## Interview follow-ups

- Why can a class be both a type and a value?
- What does `verbatimModuleSyntax` change?
- Why do ESM projects often include `.js` in source import paths?

## Recall

- Какие declarations исчезают после compilation?
- Почему decorator требует value import?
- Что запрещает `import type` для class?

## Mini challenge

Раздели import `User`, `createUser` и `UserRole`, если функция нужна runtime, остальные только типам.

<details>
<summary>Solution</summary>

```ts
import { createUser, type User, type UserRole } from "./user.js";
```

</details>

## Remember

```text
import type → erased
runtime function/class/decorator → value import
ESM → make module intent explicit
```

## Related topics

- [Type aliases](#/s/typescript/01-foundation/type-aliases)
- [Type-level typeof](#/s/typescript/03-generics/type-level-typeof)
- [Decorators and NestJS](#/s/typescript/05-practical/decorators-nestjs)
