# 25. Type-level `typeof`

JavaScript `typeof` и TypeScript `typeof` выглядят одинаково, но решают разные задачи.

Runtime JavaScript:

```ts
const value = "hello";

console.log(typeof value);
// "string"
```

Здесь `typeof` возвращает строку во время выполнения программы.

TypeScript умеет использовать `typeof` **в type position**, чтобы получить type уже существующего value:

```ts
const config = {
  host: "localhost",
  port: 3000,
};

type Config =
  typeof config;
```

`Config` становится примерно:

```ts
type Config = {
  host: string;
  port: number;
};
```

Главная идея:

```text
runtime value
   ↓
typeof in type position
   ↓
compile-time type
```

---

## Это способ вывести type из реального value

Без `typeof` можно написать и type, и value отдельно:

```ts
type Config = {
  host: string;
  port: number;
};

const config: Config = {
  host: "localhost",
  port: 3000,
};
```

Иногда это правильно: type является contract, а value должен ему соответствовать.

Но иногда именно runtime value является source of truth.

Например:

```ts
const defaultConfig = {
  retries: 3,
  timeout: 5000,
  enabled: true,
};

type DefaultConfig =
  typeof defaultConfig;
```

Теперь если value изменится:

```ts
const defaultConfig = {
  retries: 3,
  timeout: 5000,
  enabled: true,
  region: "eu",
};
```

type автоматически тоже получит `region`.

Это уменьшает duplication.

---

## Но направление зависимости имеет значение

Есть две разные модели.

### Type first

```ts
type Config = {
  host: string;
  port: number;
};

const config: Config = {
  host: "localhost",
  port: 3000,
};
```

Meaning:

```text
contract
↓
value must satisfy it
```

### Value first

```ts
const config = {
  host: "localhost",
  port: 3000,
};

type Config =
  typeof config;
```

Meaning:

```text
value
↓
type derived from implementation
```

Оба варианта нормальны, но semantics разные.

Если `Config` — публичный архитектурный contract, возможно, лучше type-first.

Если object — configuration constant или metadata table, value-first часто удобнее.

---

## `typeof` сохраняет inferred type, а не твоё намерение

Рассмотрим:

```ts
const config = {
  environment: "production",
};
```

Теперь:

```ts
type Config =
  typeof config;
```

может дать:

```ts
{
  environment: string;
}
```

а не:

```ts
{
  environment: "production";
}
```

Почему?

Потому что normal mutable object property widening уже произошло.

`typeof` не «замораживает» значение.

Он просто спрашивает:

> какой type TypeScript уже вывел для этого expression?

Если нужны literals:

```ts
const config = {
  environment: "production",
} as const;

type Config =
  typeof config;
```

Теперь получаем более узкий type:

```ts
{
  readonly environment: "production";
}
```

То есть:

```text
inference first
↓
typeof reads inferred type
```

Это важный нюанс.

---

## Очень полезный pattern: runtime constants → union type

Например:

```ts
const roles = [
  "admin",
  "editor",
  "user",
] as const;
```

Сначала:

```ts
typeof roles
```

даёт:

```ts
readonly [
  "admin",
  "editor",
  "user"
]
```

Дальше:

```ts
type Role =
  typeof roles[number];
```

получаем:

```ts
"admin" | "editor" | "user"
```

Теперь `roles` существует runtime:

```ts
roles.includes(...)
```

а `Role` существует compile time.

Один source of truth:

```text
runtime array
     ↓
typeof
     ↓
tuple type
     ↓
[number]
     ↓
literal union
```

Это очень распространённый pattern в TypeScript.

---

## `typeof` полезен для objects с большим количеством keys

Например permission map:

```ts
const permissions = {
  readUsers: true,
  writeUsers: true,
  deleteUsers: false,
} as const;
```

Получим весь type:

```ts
type Permissions =
  typeof permissions;
```

И keys:

```ts
type Permission =
  keyof typeof permissions;
```

Результат:

```ts
"readUsers"
| "writeUsers"
| "deleteUsers"
```

Здесь комбинируются два механизма:

```text
value
↓ typeof
object type
↓ keyof
union of keys
```

Это одна из ключевых композиционных идей TypeScript.

---

## `typeof` можно применять к function values

```ts
function createUser(
  input: CreateUserInput
) {
  return {
    id: crypto.randomUUID(),
    ...input,
  };
}
```

Можно получить function type:

```ts
type CreateUser =
  typeof createUser;
```

То есть примерно:

```ts
(input: CreateUserInput) => {
  id: string;
  ...
}
```

Дальше можно использовать utility types:

```ts
type CreateUserResult =
  ReturnType<typeof createUser>;
```

или:

```ts
type CreateUserParams =
  Parameters<typeof createUser>;
```

То есть `typeof` часто является bridge:

```text
existing function
↓
type representation
↓
type-level utilities
```

---

## Ограничение: `typeof` в type position работает не как произвольный JavaScript expression

В JavaScript можно написать:

```ts
typeof getUser()
```

runtime.

Но в TypeScript type position нельзя строить arbitrary type query из любого expression так же свободно.

Обычно `typeof` применяется к identifier или property access, чтобы type query оставалась стабильной и понятной compiler-у.

Например:

```ts
const user = getUser();

type User =
  typeof user;
```

вместо попытки выводить type напрямую из сложного runtime expression.

---

## Не создавай circular source of truth

Плохой design:

```ts
type Config =
  typeof config;

const config: Config = {
  ...
};
```

Здесь type зависит от value, а value пытается зависеть от type.

Нужен один direction.

Либо:

```text
type → value
```

либо:

```text
value → type
```

Это не только технический вопрос, но и вопрос architecture ownership.

---

## `typeof` vs explicit type

Когда value — source of truth:

```ts
const routes = {
  users: "/users",
  orders: "/orders",
} as const;

type Routes =
  typeof routes;
```

отлично.

Когда contract должен жить независимо от implementation:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

не стоит пытаться вывести interface из конкретной implementation class только ради того, чтобы «не дублировать».

Иногда duplication — это не duplication, а **намеренное разделение contract и implementation**.

---

## Вопросы на собеседовании

### Что делает type-level `typeof`?

Он получает compile-time type существующего JavaScript/TypeScript value. Это позволяет выводить types из runtime constants, objects, functions и других declarations.

### Чем он отличается от JavaScript `typeof`?

Runtime `typeof` возвращает строку вроде `"string"` или `"object"`. Type-level `typeof` не выполняется runtime и используется compiler-ом для получения типа expression.

### Сохраняет ли `typeof` literal values автоматически?

Нет. Он использует уже inferred type value. Если mutable object property была widened до `string`, `typeof` увидит `string`. Для сохранения literals часто используется `as const`.

### Зачем писать `keyof typeof value`?

`typeof` сначала превращает runtime value в type, а `keyof` затем получает union keys этого type. Это удобный способ сделать runtime object source of truth для compile-time key union.

### Когда лучше explicit type, а не `typeof`?

Когда type должен быть независимым contract и implementation обязана соответствовать ему. `typeof` лучше, когда именно value является source of truth.
