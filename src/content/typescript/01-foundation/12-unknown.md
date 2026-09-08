# 12. `unknown`

`unknown` означает:

> **значение может быть чем угодно, и пока мы не проверили его тип, пользоваться им небезопасно.**

```ts
let value: unknown;

value = "hello";
value = 42;
value = {};
value = null;
```

Присвоить в `unknown` можно практически любое значение.

Но:

```ts
value.toUpperCase();
// Error
```

И:

```ts
value.name;
// Error
```

И:

```ts
value();
// Error
```

TypeScript говорит:

> я действительно допускаю, что здесь что угодно — поэтому сначала докажи, что конкретная операция безопасна.

---

## `unknown` — безопасная версия «я не знаю тип»

Сравним:

```ts
function handle(value: any) {
  value.toUpperCase();
}
```

Compiler разрешает вызов.

Но runtime:

```ts
handle(123);
```

сломается.

Теперь:

```ts
function handle(value: unknown) {
  value.toUpperCase();
}
```

TypeScript не позволит это скомпилировать.

Нужно выполнить narrowing:

```ts
function handle(value: unknown) {
  if (typeof value === "string") {
    return value.toUpperCase();
  }

  return String(value);
}
```

Внутри:

```ts
if (typeof value === "string")
```

TypeScript знает:

```text
value: unknown
       ↓
typeof check
       ↓
value: string
```

Это ключевая разница между `unknown` и `any`.

---

## `unknown` особенно полезен на system boundaries

Допустим, мы читаем JSON:

```ts
const data: unknown = await loadExternalData();
```

Это честное описание ситуации.

На момент получения данных мы **не знаем**, соответствуют ли они нашим ожиданиям.

Нельзя просто сделать:

```ts
const user: User = data;
// Error
```

Сначала нужна проверка.

Упрощённый пример:

```ts
function isUser(value: unknown): value is User {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  return (
    "id" in value &&
    "name" in value
  );
}
```

После:

```ts
if (!isUser(data)) {
  throw new Error("Invalid user");
}

data.name;
// User
```

В production для сложных payloads обычно используют runtime validation/schema libraries, но архитектурная идея остаётся той же:

```text
external data
     ↓
unknown
     ↓
validation
     ↓
domain type
```

---

## `unknown` не является runtime validation

Важно не сделать противоположную ошибку.

```ts
const data: unknown = await api.get();
```

само по себе **ничего не проверило**.

Мы лишь правильно описали состояние знаний:

> пока не известно, что это.

Чтобы получить:

```ts
User
```

должна появиться реальная проверка или доверенная conversion boundary.

---

## Можно присвоить что угодно в `unknown`, но не наоборот

```ts
let value: unknown;

value = "hello";
value = 123;
value = true;
```

Всё нормально.

Но:

```ts
const name: string = value;
// Error
```

Потому что `unknown` может оказаться `number`, `null`, object и т.д.

Допустимо:

```ts
const anotherUnknown: unknown = value;
const unsafe: any = value;
```

То есть `unknown` находится очень высоко в системе типов:

```text
string ─┐
number ─┤
User ───┤
null ───┤→ unknown
Error ──┤
... ────┘
```

Он может представлять любое значение, но почти ничего не обещает о нём.

---

## `unknown` и narrowing

Практически вся ценность `unknown` раскрывается вместе с narrowing.

### `typeof`

```ts
function normalize(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return value.toString();
  }

  throw new Error("Unsupported value");
}
```

### `instanceof`

```ts
function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
```

### Object checks

```ts
function hasId(
  value: unknown
): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}
```

Type guards будут отдельной темой, но `unknown` — один из главных случаев, где они реально нужны.

---

## `catch` — хороший реальный пример

В JavaScript можно throw не только `Error`:

```ts
throw new Error("failed");
throw "failed";
throw 123;
throw { reason: "failed" };
```

Поэтому такое предположение потенциально неправильное:

```ts
try {
  await execute();
} catch (error) {
  console.log(error.message);
}
```

При строгой конфигурации TypeScript catch variable может рассматриваться как `unknown`.

Правильная обработка:

```ts
try {
  await execute();
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error("Unknown error", error);
  }
}
```

Это не TypeScript bureaucracy — JavaScript реально позволяет throw любое значение.

---

## `unknown` vs `object`

Иногда путают:

```ts
unknown
```

и:

```ts
object
```

`unknown` может быть вообще чем угодно:

```ts
const a: unknown = "hello";
const b: unknown = 123;
const c: unknown = null;
```

`object` означает non-primitive object-like value:

```ts
let value: object;

value = {};
value = [];
value = new Date();

value = "hello";
// Error
```

Если реальное состояние:

> я вообще не знаю, что пришло,

правильнее `unknown`.

Если контракт:

> здесь обязательно какой-то object,

тогда может быть уместен `object` или, чаще, более конкретный object type.

---

## Интересная algebra типов

`unknown` ведёт себя как верхний safe type.

Например:

```ts
type A = string | unknown;
// unknown
```

Если значение может быть `string` **или вообще чем угодно**, в результате мы знаем только:

```ts
unknown
```

Но intersection:

```ts
type B = string & unknown;
// string
```

Если значение должно быть `string` и одновременно соответствовать `unknown`, дополнительного ограничения не появляется.

Conceptually:

```text
T | unknown → unknown
T & unknown → T
```

Это становится особенно полезно позже при понимании conditional и advanced types.

---

## Когда использовать `unknown`

Очень хорошие кандидаты:

```ts
function parse(value: unknown) {}

function handleError(error: unknown) {}

function validatePayload(payload: unknown) {}
```

Особенно для:

* HTTP responses;
* parsed JSON;
* third-party messages;
* queue payloads;
* browser storage;
* caught errors;
* dynamically loaded configuration.

Не нужно заменять каждый `any` механически на `unknown`.

Но если смысл действительно:

> **тип этого значения пока неизвестен**,

то `unknown` обычно выражает это гораздо точнее.

---

## Вопросы на собеседовании

### Что такое `unknown`?

`unknown` — это безопасный тип для значения, о котором пока ничего не известно. Любое значение можно присвоить в `unknown`, но выполнять специфические операции или присваивать его в более узкий тип нельзя, пока не выполнен narrowing.

### Почему `unknown` безопаснее `any`?

`any` разрешает использовать значение практически без type checking. `unknown` сохраняет неопределённость в type system и заставляет проверить тип перед использованием.

### Где вы бы использовали `unknown`?

Чаще всего на boundaries, где данные приходят извне и ещё не были проверены: API payloads, parsed JSON, queue messages, caught errors или данные third-party libraries.

### Валидирует ли `unknown` данные?

Нет. Он только говорит compiler-у, что тип неизвестен. Чтобы превратить `unknown` в domain type, нужна реальная runtime validation или другое доказательство типа.

### Чем `unknown` отличается от `object`?

`unknown` может содержать вообще любое значение, включая primitives, `null` и `undefined`. `object` ограничивает значение non-primitive object-like значениями.
