# 13. `never`

`never` означает:

> **значение, которое не может существовать.**

Это самый узкий тип TypeScript.

Например функция, которая всегда throws:

```ts
function fail(message: string): never {
  throw new Error(message);
}
```

Она не возвращает:

```ts
undefined
```

и не возвращает:

```ts
void
```

Она **вообще никогда не производит значение для caller-а**.

---

## `never` vs `void`

Это важное различие.

```ts
function log(message: string): void {
  console.log(message);
}
```

Функция завершается нормально:

```ts
log("hello");

// execution continues here
```

`void` означает:

> caller не должен ожидать полезного return value.

Теперь:

```ts
function fail(message: string): never {
  throw new Error(message);
}
```

После успешного вызова `fail()` выполнение не продолжается:

```ts
fail("Something went wrong");

// unreachable
```

Поэтому:

```text
void
→ функция возвращается
→ полезного значения нет

never
→ функция вообще не возвращается
```

---

## Infinite loop тоже может возвращать `never`

```ts
function runForever(): never {
  while (true) {
    processJobs();
  }
}
```

У функции нет reachable endpoint.

Другой практический пример в Node.js — операции вроде завершения процесса могут быть типизированы как `never`, потому что нормальное выполнение после них не продолжается.

---

## Самый важный use case — impossible states после narrowing

Рассмотрим union:

```ts
type Result =
  | {
      status: "success";
      data: User;
    }
  | {
      status: "error";
      error: Error;
    };
```

Обработаем все варианты:

```ts
function handle(result: Result) {
  if (result.status === "success") {
    return result.data;
  }

  if (result.status === "error") {
    throw result.error;
  }

  result;
  // never
}
```

После двух проверок других вариантов не осталось.

TypeScript conceptually делает:

```text
Result

success | error
     ↓
remove success

error
     ↓
remove error

nothing
     ↓
never
```

Это одна из самых важных ролей `never`: представить место, которое согласно type system **невозможно достигнуть**.

---

## Exhaustive checking

Из этого свойства получается очень полезный pattern.

```ts
type PaymentStatus =
  | "pending"
  | "paid"
  | "failed";

function getLabel(
  status: PaymentStatus
): string {
  switch (status) {
    case "pending":
      return "Waiting";

    case "paid":
      return "Paid";

    case "failed":
      return "Failed";

    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
```

Пока обработаны все варианты:

```ts
status
```

в `default` имеет тип `never`.

Теперь кто-то добавляет:

```ts
type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";
```

Но забывает изменить `switch`.

В `default` теперь остаётся:

```ts
"refunded"
```

и TypeScript выдаёт ошибку:

```ts
const exhaustive: never = status;
// "refunded" is not assignable to never
```

Compiler заставляет обновить код при расширении union.

Это будет подробнее в отдельном уроке про exhaustive checking, но именно `never` делает такой pattern возможным.

---

## `never` исчезает из union

Рассмотрим:

```ts
type Result = string | never;
```

Результат:

```ts
string
```

Почему?

`never` не добавляет ни одного возможного значения.

Можно представить types как множества:

```text
string
= множество всех strings

never
= пустое множество
```

Тогда:

```text
string ∪ empty
=
string
```

Поэтому:

```ts
string | never
```

упрощается до:

```ts
string
```

Это становится очень важным в conditional types.

Например позже можно будет написать:

```ts
type OnlyStrings<T> =
  T extends string
    ? T
    : never;
```

Для:

```ts
type Result =
  OnlyStrings<string | number | boolean>;
```

неподходящие members превращаются в `never` и исчезают из union.

Результат:

```ts
string
```

---

## `never` — противоположность `unknown`

Полезная модель:

```text
unknown
→ может быть вообще любое значение

never
→ не может быть ни одного значения
```

В terms of assignability:

```ts
let impossible: never;
```

Нельзя сделать:

```ts
impossible = "hello";
impossible = 123;
impossible = undefined;
```

Даже значение типа `any` не является обычным способом получить `never`.

Но значение `never` можно использовать там, где ожидается другой тип, потому что реального значения всё равно никогда не будет.

Например:

```ts
function fail(): never {
  throw new Error();
}

const name: string = fail();
```

Это type-safe.

`fail()` никогда реально не вернёт incompatible value.

---

## `never` может появляться из конфликтующих типов

Мы уже видели похожую ситуацию с intersections.

```ts
type A = {
  id: string;
};

type B = {
  id: number;
};

type C = A & B;
```

Что такое:

```ts
C["id"]
```

?

Значение должно одновременно быть:

```text
string
AND
number
```

Такого значения нет.

Поэтому:

```ts
type Id = C["id"];
// never
```

Это хороший способ думать о `never`:

> TypeScript пришёл к набору требований, которым не соответствует ни одно возможное значение.

---

## `never` не должен использоваться вместо `void`

Плохое понимание:

```ts
function saveUser(user: User): never {
  repository.save(user);
}
```

Если функция заканчивается нормально, она не `never`.

Правильно:

```ts
function saveUser(user: User): void {
  repository.save(user);
}
```

или, если возвращается Promise:

```ts
async function saveUser(
  user: User
): Promise<void> {
  await repository.save(user);
}
```

`never` нужен не для:

> функция ничего не возвращает.

Он нужен для:

> **функция не может нормально завершиться и вернуть управление caller-у.**

---

## `never` часто не пишут вручную

В application code редко возникает необходимость объявлять:

```ts
const value: never
```

напрямую.

Чаще `never` является **результатом работы type system**:

* невозможная ветка narrowing;
* exhaustive checking;
* несовместимый intersection;
* conditional type, который отбрасывает вариант;
* функция, которая никогда не возвращает.

Поэтому понимание `never` полезнее, чем частое ручное использование `never`.

---

## Вопросы на собеседовании

### Что такое `never`?

`never` представляет тип значения, которое невозможно получить. Он возникает у функций, которые никогда нормально не возвращаются, и в control-flow analysis, когда TypeScript исключил все возможные варианты.

### Чем `never` отличается от `void`?

`void` означает, что функция может нормально завершиться, но caller не получает полезного значения. `never` означает, что функция вообще не возвращает управление нормальным способом, например всегда throws или бесконечно выполняется.

### Почему `never` полезен для exhaustive checking?

После обработки всех members union оставшееся значение должно иметь тип `never`. Если позже в union добавится новый member и его забудут обработать, он больше не будет assignable to `never`, и compiler покажет ошибку.

### Почему `string | never` превращается в `string`?

`never` не содержит возможных значений, поэтому ничего не добавляет union. Это свойство активно используется в conditional types для фильтрации union members.

### Где `never` обычно появляется в реальном коде?

В error functions, exhaustive `switch`, unreachable branches после narrowing, конфликтующих intersections и advanced type transformations. Обычно это результат reasoning TypeScript type system, а не тип, который приходится часто объявлять вручную.
