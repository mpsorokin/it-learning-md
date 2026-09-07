---
title: Decorators and NestJS
titleRu: Декораторы и NestJS
slug: decorators-nestjs
section: practical
order: 40
difficulty: advanced
estimatedMinutes: 7
tags:
  - typescript
  - decorators
prerequisites:
  - esm-type-only-imports
  - tsconfig-strict-mode
---

# Decorators and NestJS

## TL;DR

Decorator — runtime-функция, применяемая к class или его members для регистрации поведения и metadata. NestJS использует decorators для dependency injection, routing и параметров; TypeScript-типы сами по себе в runtime недоступны.

## Mental model

```text
@Decorator(metadata)
        ↓
runtime framework registration around a class/member
```

Decorator syntax выглядит декларативно, но исполняется при загрузке module.

## Core idea

- Decorators — runtime values, поэтому требуют обычного import.
- Nest читает metadata для построения container и routes.
- Interface нельзя использовать как runtime DI token.
- Legacy experimental decorators и standard decorators имеют разные semantics; проверяй режим framework/version.

## Example 1 — Basic

```ts
function Tagged(tag: string) {
  return function (target: Function) {
    Reflect.defineProperty(target, "tag", { value: tag });
  };
}

@Tagged("service")
class UserService {}
```

Decorator factory получает настройку, затем вызывается с class value.

## Example 2 — Real-world

```ts
@Controller("users")
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findById(id);
  }
}
```

Nest регистрирует controller, route и способ получения параметра.

## Example 3 — Important nuance

```ts
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

constructor(
  @Inject(USER_REPOSITORY) private readonly repository: UserRepository,
) {}
```

`UserRepository` interface стёрт; runtime container использует symbol token.

## Common mistake

```ts
// problematic
import type { Injectable } from "@nestjs/common";
@Injectable()

// better
import { Injectable } from "@nestjs/common";
@Injectable()
```

Decorator вызывается в JavaScript и не может быть type-only import.

> **Interview note**

NestJS historically relies on TypeScript's experimental decorator metadata. Standard decorators are not автоматически взаимозаменяемы с этим pipeline.

## Interview answer

> **How does NestJS use TypeScript decorators?**

NestJS decorators execute at runtime and attach or expose metadata that the framework scans to build controllers, routes, providers, and parameter bindings. Type annotations are erased, so interfaces cannot serve as dependency-injection tokens; I use classes, strings, or symbols for runtime identity. I also keep decorator imports as value imports and align compiler decorator settings with the NestJS version in use.

## Interview follow-ups

- Why cannot an interface be a NestJS injection token?
- When does decorator code execute?
- How do standard decorators differ from legacy experimental decorators?
- Why is reflection metadata relevant to NestJS?

## Recall

- Какие части decorator существуют в runtime?
- Почему symbol подходит DI token?
- Как type-only import ломает decorator?
- Что нужно проверить при смене decorator semantics?

## Mini challenge

Исправь DI-контракт для interface `Mailer`, создав runtime token.

<details>
<summary>Solution</summary>

```ts
export const MAILER = Symbol("MAILER");

@Injectable()
class NotificationService {
  constructor(@Inject(MAILER) private readonly mailer: Mailer) {}
}
```

</details>

## Remember

```text
decorator → runtime function
interface → erased, not a DI token
Nest metadata → framework registration
decorator mode → match framework expectations
```

## Related topics

- [ESM and type-only imports](#/s/typescript/05-practical/esm-type-only-imports)
- [Interfaces](#/s/typescript/01-foundation/interfaces)
- [Type-level typeof](#/s/typescript/03-generics/type-level-typeof)
