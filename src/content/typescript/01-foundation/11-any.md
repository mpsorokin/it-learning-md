---
title: any
titleRu: Тип any
slug: any
section: foundation
order: 11
difficulty: beginner
estimatedMinutes: 4
tags:
  - typescript
  - any
prerequisites:
  - type-annotations
---

# any

## TL;DR

`any` почти отключает проверку для значения и распространяет потерю типов дальше по программе. Это escape hatch для миграции или плохо типизированной библиотеки, а не тип неизвестных данных.

## Mental model

```text
any → compiler, trust me
```

TypeScript разрешает читать свойства, вызывать значение и присваивать его почти куда угодно.

## Core idea

- `any` совместим почти с любым типом в обе стороны.
- Операции над `any` часто тоже возвращают `any`.
- Runtime-ошибки остаются возможными.
- `noImplicitAny` предотвращает неявное появление `any` в параметрах.

## Example 1 — Basic

```ts
let payload: any = 42;

payload.missing.deep.call(); // compiles, crashes
const name: string = payload;
```

Компилятор больше не защищает этот участок.

## Example 2 — Real-world

```ts
function migrateLegacyRecord(record: any): User {
  // Temporary boundary around an untyped legacy SDK.
  return { id: String(record.user_id), email: String(record.mail) };
}
```

Если `any` неизбежен, локализуй его на маленькой границе и верни проверяемый тип.

## Common mistake

```ts
// problematic
function handleResponse(data: any) {
  return data.user.email.toLowerCase();
}

// better
function handleResponse(data: unknown) {
  if (!isUserResponse(data)) throw new Error("Invalid response");
  return data.user.email.toLowerCase();
}
```

Внешние данные неизвестны, а не «разрешены любые операции».

## Interview answer

> **What are the risks of `any` in TypeScript?**

`any` opts a value out of most static checking. Property access, calls, and assignments are accepted, and the resulting `any` can spread through otherwise typed code. I reserve it for narrow migration or interoperability boundaries, document why it exists, and convert it to a checked type as early as possible. For unknown external data, I use `unknown` instead.

## Interview follow-ups

- How does `noImplicitAny` help?
- What is the difference between explicit and implicit `any`?
- How can `any` spread through a codebase?

## Recall

- Какие проверки отключает `any`?
- Почему `any` на API-ответе опасен?
- Как ограничить неизбежный escape hatch?

## Mini challenge

Замени `any` безопасным типом и сохрани возможность вывести значение:

```ts
function debug(value: any) {
  console.log(value.toString());
}
```

<details>
<summary>Solution</summary>

```ts
function debug(value: unknown) {
  console.log(String(value));
}
```

</details>

## Remember

```text
any → checking disabled
unknown external value → unknown
unavoidable any → isolate and convert
```

## Related topics

- [Unknown](#/s/typescript/01-foundation/unknown)
- [Type guards](#/s/typescript/02-narrowing/type-guards)
- [tsconfig and strict mode](#/s/typescript/05-practical/tsconfig-strict-mode)
