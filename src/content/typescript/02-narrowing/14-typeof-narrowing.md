# 14. `typeof` Narrowing

`typeof` narrowing позволяет TypeScript сузить union на основе JavaScript-проверки:

```ts
typeof value
```

Базовый пример:

```ts
function normalize(value: string | number) {
  if (typeof value === "string") {
    return value.trim();
  }

  return value.toFixed(2);
}
```

До `if`:

```text
value: string | number
```

Внутри ветки:

```text
typeof value === "string"
↓
value: string
```

После неё остаётся:

```text
value: number
```

TypeScript использует обычный JavaScript control flow и переносит результат проверки в type system.

---

## Какие значения умеет различать `typeof`

На практике чаще всего используются:

```text
"string"
"number"
"boolean"
"bigint"
"symbol"
"undefined"
"function"
"object"
```

Например:

```ts
function format(
  value: string | number | undefined
) {
  if (typeof value === "undefined") {
    return "-";
  }

  if (typeof value === "string") {
    return value.toUpperCase();
  }

  return value.toFixed(2);
}
```

TypeScript постепенно исключает варианты:

```text
string | number | undefined
↓ remove undefined
string | number
↓ remove string
number
```

Это не отдельная «магия narrowing». Compiler просто анализирует reachable branches.

---

## `typeof` особенно полезен с `unknown`

```ts
function getLength(value: unknown): number {
  if (typeof value === "string") {
    return value.length;
  }

  throw new Error("Expected string");
}
```

До проверки нельзя:

```ts
value.length;
```

Потому что `unknown` не гарантирует наличие такого property.

После:

```ts
typeof value === "string"
```

TypeScript уже знает, что работает со `string`.

Это один из самых типичных patterns при работе с:

* external data;
* error values;
* JSON;
* generic runtime input.

---

## Важный нюанс: `typeof null === "object"`

JavaScript имеет историческую особенность:

```ts
typeof null === "object";
// true
```

Поэтому такая проверка недостаточна:

```ts
function printKeys(
  value: object | null
) {
  if (typeof value === "object") {
    Object.keys(value);
  }
}
```

TypeScript должен учитывать, что `null` тоже проходит `typeof value === "object"`.

Нужна дополнительная проверка:

```ts
function printKeys(
  value: object | null
) {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    Object.keys(value);
  }
}
```

Практический pattern:

```text
object check
=
typeof value === "object"
+
value !== null
```

Особенно при работе с `unknown`.

---

## `typeof "function"` действительно сужает до callable type

Например:

```ts
function execute(
  value: string | (() => string)
) {
  if (typeof value === "function") {
    return value();
  }

  return value;
}
```

TypeScript понимает, что в первой ветке `value` callable.

Это полезно в API, где parameter может быть:

```text
direct value
или
factory function
```

Например:

```ts
type ValueOrFactory<T> =
  T | (() => T);

function resolve<T>(
  input: ValueOrFactory<T>
): T {
  return typeof input === "function"
    ? (input as () => T)()
    : input;
}
```

Здесь уже появляется generic nuance: TypeScript не всегда может идеально связать generic `T` с callable possibility, поэтому иногда приходится помогать compiler-у. Но сам runtime guard остаётся `typeof`.

---

## Narrowing работает и через отрицание

Не обязательно писать:

```ts
if (typeof value === "string") {
  // string
}
```

Можно:

```ts
function process(
  value: string | number
) {
  if (typeof value !== "string") {
    return value.toFixed();
  }

  return value.toUpperCase();
}
```

В первой ветке:

```text
number
```

Во второй:

```text
string
```

TypeScript reasoning учитывает и положительные, и отрицательные условия.

---

## Проверка может потеряться после mutation

Рассмотрим:

```ts
let value: string | number = "hello";

if (typeof value === "string") {
  value = 123;

  value.toUpperCase();
}
```

После присваивания TypeScript больше не может считать `value` строкой.

Это важный принцип narrowing:

> narrowing относится к текущему состоянию control flow, а не навсегда меняет declared type переменной.

Declared type остаётся:

```ts
string | number
```

а текущий narrowed type зависит от конкретной точки программы.

---

## Не используй `typeof` там, где он не различает domain variants

Допустим:

```ts
type User = {
  id: string;
};

type Order = {
  id: string;
  total: number;
};

function handle(value: User | Order) {
  if (typeof value === "object") {
    // всё ещё User | Order
  }
}
```

`typeof` здесь бесполезен, потому что оба union members — objects.

Нужно искать другой discriminant:

```ts
if ("total" in value) {
  // Order
}
```

или лучше заранее моделировать explicit discriminated union.

Правило простое:

```text
typeof
→ хорошо различает primitive categories

object variants
→ обычно нужен другой guard
```

---

## Вопросы на собеседовании

### Что делает `typeof` narrowing?

TypeScript использует runtime-проверку `typeof` для исключения несовместимых members union. После проверки compiler знает более узкий тип в соответствующей control-flow branch.

### Почему `typeof value === "object"` недостаточно для проверки объекта?

Потому что в JavaScript `typeof null === "object"`. Обычно нужно дополнительно проверять `value !== null`.

### Работает ли narrowing после изменения переменной?

TypeScript отслеживает assignments. Если значение после narrowing было изменено, compiler пересчитывает текущий тип и больше не опирается на старую проверку.

### Когда `typeof` плохо подходит для narrowing?

Когда несколько union members имеют одну и ту же runtime category, например два разных object types. Тогда `typeof` не даёт информации, позволяющей их различить.
