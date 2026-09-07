---
title: Exhaustive Checking
titleRu: Исчерпывающая проверка
slug: exhaustive-checking
section: narrowing
order: 19
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - exhaustiveness
prerequisites:
  - never
  - discriminated-unions
---

# Exhaustive Checking

## TL;DR

Exhaustive checking заставляет обработать каждый вариант union. После всех известных веток значение должно иметь тип `never`; новый вариант тогда вызывает compile error в старом обработчике.

## Mental model

```text
union − handled cases = never
```

Если остаток не `never`, обработка неполна.

## Core idea

- Работает лучше всего с discriminated unions.
- `assertNever` одновременно даёт compile-time и runtime защиту.
- Присваивание в `never` подходит, когда функция ничего не должна вызывать.
- `default` без проверки может скрыть новый вариант.

## Example 1 — Basic

```ts
type Direction = "up" | "down";

function offset(direction: Direction): number {
  switch (direction) {
    case "up": return -1;
    case "down": return 1;
  }
  const exhaustive: never = direction;
  return exhaustive;
}
```

Добавление `"left"` сломает присваивание, пока case не появится.

## Example 2 — Real-world

```ts
function render(state: RequestState<User>): View {
  switch (state.status) {
    case "idle": return emptyView();
    case "loading": return spinner();
    case "success": return userView(state.data);
    case "error": return errorView(state.error);
    default: return assertNever(state);
  }
}
```

UI не сможет молча забыть новый state.

## Common mistake

```ts
// problematic
default: return emptyView();

// better
default: return assertNever(state);
```

Без `never` новый вариант компилируется и попадает в неподходящий fallback.

## Interview answer

> **How do you implement exhaustive checking in TypeScript?**

I discriminate a union in a `switch` and make the unreachable remainder flow into a `never` assignment or an `assertNever` function. Once every member is handled, the value narrows to `never`. If another member is later added to the union, existing switches fail to compile, which turns an easy-to-miss behavior gap into an explicit maintenance task.

## Interview follow-ups

- Why can a default branch hide missing cases?
- What should `assertNever` return?
- Can exhaustiveness work with string literal unions?

## Recall

- Почему остаток полного switch равен `never`?
- Что произойдёт после добавления нового union member?
- Зачем `assertNever` бросает runtime-ошибку?

## Mini challenge

Добавь exhaustive handling к union ролей `admin | editor | viewer`.

<details>
<summary>Solution</summary>

Обработай три `case`, затем передай оставшуюся role в `assertNever(role)`.

</details>

## Remember

```text
all cases handled → never remains
assertNever → compiler + runtime guard
generic default → may hide missing behavior
```

## Related topics

- [never](#/s/typescript/01-foundation/never)
- [Discriminated unions](#/s/typescript/02-narrowing/discriminated-unions)
- [Control-flow analysis](#/s/typescript/02-narrowing/control-flow-analysis)
