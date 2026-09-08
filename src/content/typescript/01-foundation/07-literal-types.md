# 7. Literal Types

Literal type описывает не весь `string`, `number` или `boolean`, а **конкретное допустимое значение**.

```ts
type Direction = "left" | "right";

function move(direction: Direction) {
  // ...
}
```

Теперь:

```ts
move("left");   // OK
move("right");  // OK

move("forward");
// Error
```

`"left"` здесь одновременно:

* JavaScript value;
* TypeScript type, содержащий только одно возможное значение.

Literal types особенно полезны вместе с unions.

---

## Literal union часто лучше обычного `string`

Рассмотрим:

```ts
function setLogLevel(level: string) {
  // ...
}
```

Caller может передать что угодно:

```ts
setLogLevel("debug");
setLogLevel("banana");
```

TypeScript не видит проблемы.

Если реально поддерживаются только определённые значения:

```ts
type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error";

function setLogLevel(level: LogLevel) {
  // ...
}
```

Теперь contract отражает реальное API.

Плюсом IDE получает autocomplete:

```text
debug
info
warn
error
```

То есть literal types дают одновременно:

* type safety;
* self-documenting API;
* autocomplete.

---

## `const` и `let` выводятся по-разному

```ts
const environment = "production";
```

TypeScript может сохранить:

```ts
"production"
```

Потому что `environment` нельзя переназначить.

Но:

```ts
let environment = "production";
```

обычно выводится как:

```ts
string
```

Потому что позже допустимо:

```ts
environment = "development";
```

Это называется literal widening.

TypeScript выбирает тип не только исходя из текущего значения, но и из предполагаемой mutability.

---

## Object properties тоже обычно widening

Это часто неожиданно:

```ts
const config = {
  environment: "production",
};
```

Несмотря на `const`, property обычно имеет тип:

```ts
config.environment;
// string
```

Почему?

Потому что `const` запрещает заменить сам reference:

```ts
config = anotherConfig;
// Error
```

но property остаётся mutable:

```ts
config.environment = "development";
// OK
```

Поэтому `"production"` расширяется до `string`.

---

## `as const` сохраняет literals

Если точные значения важны:

```ts
const config = {
  environment: "production",
  retries: 3,
} as const;
```

Теперь TypeScript выводит примерно:

```ts
{
  readonly environment: "production";
  readonly retries: 3;
}
```

То есть `as const`:

* предотвращает обычный literal widening;
* делает object properties readonly;
* превращает array literals в readonly tuples.

Например:

```ts
const roles = [
  "admin",
  "editor",
  "user",
] as const;
```

получаем:

```ts
readonly [
  "admin",
  "editor",
  "user"
]
```

а не просто:

```ts
string[]
```

---

## Literal types позволяют иметь один source of truth

Очень распространённый pattern:

```ts
const roles = [
  "admin",
  "editor",
  "user",
] as const;

type Role = typeof roles[number];
```

Теперь `Role`:

```ts
"admin" | "editor" | "user"
```

Мы не дублируем:

```ts
const roles = [...];

type Role =
  | "admin"
  | "editor"
  | "user";
```

Массив можно использовать runtime:

```ts
roles.includes(...)
```

а type — compile time.

Это хороший пример того, как TypeScript позволяет связать runtime values и type system без ручного дублирования.

---

## Literal types отлично работают как discriminants

```ts
type Success = {
  status: "success";
  data: User;
};

type Failure = {
  status: "error";
  error: Error;
};

type Result = Success | Failure;
```

`status` — literal type.

Поэтому:

```ts
function handle(result: Result) {
  if (result.status === "success") {
    result.data;
  } else {
    result.error;
  }
}
```

TypeScript может определить конкретный member union на основании literal field.

То есть literal types — одна из фундаментальных деталей, на которых строятся discriminated unions.

---

## Boolean literals тоже существуют

Можно писать:

```ts
type SuccessResult = {
  success: true;
  data: User;
};

type ErrorResult = {
  success: false;
  error: Error;
};
```

Это вполне нормальный discriminant:

```ts
type Result =
  | SuccessResult
  | ErrorResult;
```

Хотя строковые literals часто читаются лучше, потому что:

```ts
status: "loading" | "success" | "error"
```

масштабируется на большее количество состояний, чем `true | false`.

---

## Numeric literals тоже могут быть полезны

Например:

```ts
type DiceRoll =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;
```

Или HTTP-style domain API:

```ts
type SuccessStatus =
  | 200
  | 201
  | 204;
```

Но для больших числовых диапазонов literal union быстро становится неудобным. Literal types хороши для небольшого конечного набора значений.

---

## Literal union vs enum

Для многих application-level API:

```ts
type Role =
  | "admin"
  | "editor"
  | "user";
```

может быть проще, чем enum.

Literal union:

* не создаёт дополнительный JavaScript object;
* хорошо работает с обычными строками;
* легко комбинируется с unions;
* хорошо поддерживается autocomplete.

Но enum имеет собственную семантику и иногда удобен, если нужен runtime namespace/value object.

Поэтому это не правило:

> enums плохие.

Скорее:

> для простого конечного набора строковых значений literal union часто является более лёгкой abstraction.

---

## Не расширяй type до `string` без необходимости

Плохой API:

```ts
type User = {
  role: string;
};
```

если система реально разрешает:

```text
admin
editor
user
```

Лучше:

```ts
type Role =
  | "admin"
  | "editor"
  | "user";

type User = {
  role: Role;
};
```

Теперь impossible value:

```ts
const user: User = {
  role: "super-mega-admin",
};
```

ловится compiler-ом.

Это и есть одна из ключевых идей хорошего type design:

> делай тип настолько узким, насколько позволяют реальные guarantees системы.

---

## Вопросы на собеседовании

### Что такое literal type?

Literal type представляет одно конкретное значение, например `"success"`, `42` или `true`, а не весь `string`, `number` или `boolean`.

### Почему `const x = "hello"` может иметь literal type, а `let x = "hello"` — `string`?

Потому что `const` нельзя переназначить, поэтому TypeScript может безопасно сохранить точное значение `"hello"`. `let` предполагает дальнейшее изменение, поэтому тип обычно widening до `string`.

### Почему property объекта widening даже при `const`?

`const` запрещает переназначить object reference, но не запрещает менять его properties. Поэтому:

```ts
const config = {
  env: "prod",
};
```

обычно получает `env: string`, а не `"prod"`.

### Что делает `as const`?

Он предотвращает обычный literal widening и делает структуру readonly. Для массива это обычно означает readonly tuple, а для объекта — readonly properties с сохранёнными literal types.

### Когда literal union лучше `string`?

Когда API допускает небольшой известный набор значений. Это даёт более точный contract, autocomplete и compile-time проверку недопустимых состояний.
