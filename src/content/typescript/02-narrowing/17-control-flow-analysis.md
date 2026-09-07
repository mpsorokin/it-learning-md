---
title: Control-flow Analysis
titleRu: Анализ потока управления
slug: control-flow-analysis
section: narrowing
order: 17
difficulty: intermediate
estimatedMinutes: 5
tags:
  - typescript
  - control-flow
prerequisites:
  - typeof-narrowing
---

# Control-flow Analysis

## TL;DR

TypeScript отслеживает присваивания, условия, ранние выходы и достижимость, вычисляя текущий тип переменной в каждой точке. Narrowing — не изменение объявленного типа, а знание о конкретном пути выполнения.

## Mental model

```text
declared type + path facts = type at this line
```

Каждая ветка добавляет или удаляет известные факты.

## Core idea

- `return`, `throw`, `continue` и `break` влияют на оставшийся тип.
- Присваивание меняет наблюдаемый тип, но проверяется против объявленного.
- Проверка alias может сузить исходное значение.
- Callback и mutation могут отменить факт, если компилятор не гарантирует стабильность.

## Example 1 — Basic

```ts
function pad(value: string | number) {
  if (typeof value === "number") return " ".repeat(value);
  return value.trim(); // value: string
}
```

Number-ветка завершилась, поэтому в остатке возможна только строка.

## Example 2 — Real-world

```ts
function checkout(cart: Cart | null) {
  if (!cart) throw new Error("Cart required");
  if (cart.items.length === 0) return { ok: false as const };

  return payment.charge(cart.total);
}
```

После guard clause `cart` остаётся non-null во всём основном пути.

## Example 3 — Important nuance

```ts
let value: string | number = "ready";
value = 42;
value.toFixed(); // observed as number
```

Объявленный union позволяет оба присваивания, но текущий flow знает последнее значение.

## Common mistake

```ts
// problematic
if (user.profile) {
  queueMicrotask(() => console.log(user.profile.name));
}

// better
const profile = user.profile;
if (profile) queueMicrotask(() => console.log(profile.name));
```

Между проверкой и callback свойство может измениться. Локальная константа сохраняет доказательство.

## Interview answer

> **What is control-flow analysis in TypeScript?**

Control-flow analysis tracks runtime-like facts from conditions, assignments, and reachability to refine a variable's type at each program point. Early returns and throws remove possibilities from later code, while assignments update the observed type within the declared contract. The compiler may discard a narrowing across callbacks or mutations when it cannot prove the value stayed unchanged.

## Interview follow-ups

- How do guard clauses improve narrowing?
- Can assignment narrow a variable?
- Why can narrowing be lost inside a callback?

## Recall

- Как ранний `throw` влияет на оставшийся тип?
- Чем declared type отличается от observed type?
- Зачем сохранять проверенное свойство в `const`?

## Mini challenge

Перепиши вложенные проверки nullable user и email двумя guard clauses.

<details>
<summary>Solution</summary>

```ts
if (!user) return;
if (!user.email) return;
send(user.email);
```

</details>

## Remember

```text
type at line = declared type + flow facts
early exit → removes possibilities
unstable mutation → may lose narrowing
```

## Related topics

- [typeof narrowing](#/s/typescript/02-narrowing/typeof-narrowing)
- [Discriminated unions](#/s/typescript/02-narrowing/discriminated-unions)
- [Exhaustive checking](#/s/typescript/02-narrowing/exhaustive-checking)
