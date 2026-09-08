# 37. `satisfies`

Оператор `satisfies` позволяет проверить:

> **соответствует ли expression определённому type, не заменяя при этом собственный inferred type expression этим type.**

Это решает очень конкретную проблему между inference и explicit annotation.

Рассмотрим:

```ts
type Route = {
  path: string;
  secure: boolean;
};

const routes: Record<string, Route> = {
  users: {
    path: "/users",
    secure: true,
  },
  health: {
    path: "/health",
    secure: false,
  },
};
```

Type annotation проверяет structure.

Но одновременно variable теперь рассматривается через объявленный type:

```ts
Record<string, Route>
```

Из-за этого часть более конкретной информации о самом literal может быть потеряна.

`satisfies` позволяет сделать иначе:

```ts
const routes = {
  users: {
    path: "/users",
    secure: true,
  },
  health: {
    path: "/health",
    secure: false,
  },
} satisfies Record<string, Route>;
```

Теперь происходят две вещи:

```text
expression
↓
проверяется против Record<string, Route>

но

inferred type expression
↓
сохраняется
```

Именно для этого `satisfies` и был добавлен в TypeScript: проверить соответствие expression контракту без ненужной потери более конкретной type information.

---

## Annotation и `satisfies` отвечают на разные вопросы

### Annotation

```ts
const config: Config = {
  host: "localhost",
  port: 3000,
};
```

Мы говорим:

> `config` имеет type `Config`.

То есть `Config` становится type variable.

### `satisfies`

```ts
const config = {
  host: "localhost",
  port: 3000,
} satisfies Config;
```

Мы говорим:

> проверь, что этот expression совместим с `Config`, но оставь его собственный inferred type.

Это subtle, но важное различие:

```text
annotation
expression → target type

satisfies
expression → validate against target
           → preserve expression type
```

---

## Хороший пример: finite keys

Представим:

```ts
type Environment =
  | "development"
  | "staging"
  | "production";

type EnvironmentConfig = {
  apiUrl: string;
  debug: boolean;
};
```

Хотим гарантировать наличие всех environments:

```ts
const configs = {
  development: {
    apiUrl: "http://localhost:3000",
    debug: true,
  },

  staging: {
    apiUrl: "https://staging.example.com",
    debug: true,
  },

  production: {
    apiUrl: "https://example.com",
    debug: false,
  },
} satisfies Record<
  Environment,
  EnvironmentConfig
>;
```

Если забыть:

```ts
staging
```

TypeScript покажет ошибку.

Если написать:

```ts
prodution
```

вместо:

```ts
production
```

TypeScript тоже поймает ошибку.

При этом `configs` остаётся конкретным object type, а не просто широким:

```ts
Record<
  Environment,
  EnvironmentConfig
>
```

---

## `satisfies` особенно полезен с `as const`

Например:

```ts
type RouteName =
  | "users"
  | "orders";

type Route =
  `/${string}`;
```

Можно написать:

```ts
const routes = {
  users: "/users",
  orders: "/orders",
} as const satisfies Record<
  RouteName,
  Route
>;
```

Здесь разные механизмы делают разную работу.

`as const`:

```text
"/users"
не widening до string

"/orders"
не widening до string
```

`satisfies`:

```text
есть ли users?
есть ли orders?
соответствуют ли values `/${string}`?
нет ли неправильных keys?
```

В итоге:

```ts
routes.users
```

остаётся:

```ts
"/users"
```

а не просто:

```ts
string
```

Очень полезная комбинация для:

* routes;
* permission maps;
* feature flags;
* configuration;
* event registries;
* static metadata.

---

## `satisfies` не делает value target type

Это принципиально.

```ts
type Config = {
  port: number;
};

const config = {
  port: 3000,
  internal: true,
} satisfies Config;
```

Если excess property rules для конкретного target не позволяют `internal`, будет ошибка.

Но сама идея `satisfies` всё равно не означает:

```ts
config: Config
```

TypeScript сохраняет тип самого expression.

Поэтому `satisfies` — **не cast**.

---

## `satisfies` vs `as`

Очень важное различие.

### Assertion

```ts
const config =
  value as Config;
```

Developer говорит:

> считай это `Config`.

TypeScript может довериться assertion даже там, где runtime guarantee отсутствует.

### `satisfies`

```ts
const config = {
  ...
} satisfies Config;
```

Compiler говорит:

> я проверю, действительно ли expression совместим с `Config`.

То есть:

```text
as
→ trust me

satisfies
→ prove compatibility
```

Поэтому использовать `as` там, где нужна просто type validation literal-а, обычно хуже.

---

## `satisfies` не выполняет runtime validation

Как всегда:

```ts
const data =
  JSON.parse(input);
```

Если написать:

```ts
const user =
  data satisfies User;
```

это не превращает arbitrary runtime JSON в проверенный `User`.

`satisfies` работает compile time с type information, доступной compiler-у.

External input по-прежнему требует runtime validation.

---

## `satisfies` полезен для tuple inference

Например иногда хочется проверить shape tuple, но сохранить inference элементов:

```ts
type NonEmptyArray<T> =
  [T, ...T[]];

const values = [
  "one",
  "two",
] satisfies NonEmptyArray<string>;
```

Теперь compiler одновременно знает:

* массив не пуст по contract;
* concrete expression соответствует этому contract.

Это ещё один пример идеи:

> target type нужен как constraint, а не обязательно как final type variable.

---

## Когда annotation лучше

Не нужно автоматически заменять:

```ts
const user: User = ...
```

на:

```ts
const user = ... satisfies User
```

Если intent:

> эта variable должна публично рассматриваться именно как `User`,

annotation более естественна.

Например:

```ts
const repository:
  UserRepository =
    new PostgresUserRepository();
```

Здесь мы сознательно хотим абстрагироваться от concrete implementation.

Сохранение всех implementation details не является преимуществом.

---

## Когда `satisfies` особенно хорош

Когда:

1. есть literal/configuration structure;
2. нужно проверить её против contract;
3. при этом хочется сохранить precise inference самого literal.

Типичные examples:

```ts
const routes = ... satisfies Routes;
const config = ... satisfies Config;
const handlers = ... satisfies HandlerMap;
const permissions = ... satisfies PermissionMap;
```

Практическое правило:

```text
"эта variable является T"
→ annotation

"проверь, что expression соответствует T"
→ satisfies

"я знаю лучше compiler-а"
→ as
```

---

## Вопросы на собеседовании

### Что делает `satisfies`?

Он проверяет assignability expression к указанному type, но не заменяет inferred type expression этим target type.

### Чем `satisfies` отличается от type annotation?

Annotation задаёт type самой variable. `satisfies` использует type как constraint для проверки и старается сохранить более конкретную информацию expression.

### Чем `satisfies` отличается от `as`?

`as` является assertion и может заставить compiler принять type без реального доказательства. `satisfies` именно проверяет compatibility.

### Выполняет ли `satisfies` runtime validation?

Нет. Это compile-time operator.

### Почему `as const satisfies ...` часто используется вместе?

`as const` сохраняет literal types, а `satisfies` проверяет весь object против более широкого contract. Они решают разные задачи и хорошо дополняют друг друга.
