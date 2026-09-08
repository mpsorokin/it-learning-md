# 24. `keyof`

`keyof` берёт object type и возвращает union его ключей.

```ts
type User = {
  id: string;
  name: string;
  active: boolean;
};

type UserKey = keyof User;
```

Результат:

```ts
type UserKey =
  | "id"
  | "name"
  | "active";
```

То есть:

```text
object type
   ↓
keyof
   ↓
union of property keys
```

Это один из фундаментальных механизмов advanced TypeScript, потому что он позволяет строить API, которые зависят от **реальной структуры другого типа**.

---

## Зачем вообще нужен `keyof`

Без `keyof` можно написать:

```ts
function getProperty(
  user: User,
  key: string
) {
  return user[key];
}
```

Но `string` слишком широкий.

Caller может передать:

```ts
getProperty(user, "banana");
```

Хотя такого property нет.

С `keyof`:

```ts
function getProperty(
  user: User,
  key: keyof User
) {
  return user[key];
}
```

Теперь допустимы только:

```ts
getProperty(user, "id");
getProperty(user, "name");
getProperty(user, "active");
```

А:

```ts
getProperty(user, "banana");
// Error
```

То есть вместо:

```text
key: string
```

мы говорим:

```text
key must belong to User
```

---

## `keyof` особенно полезен вместе с generics

Реальный reusable pattern:

```ts
function getProperty<
  T,
  K extends keyof T
>(
  object: T,
  key: K
): T[K] {
  return object[key];
}
```

Теперь:

```ts
const user = {
  id: "u-1",
  name: "Alex",
  age: 30,
};

const name =
  getProperty(user, "name");
// string

const age =
  getProperty(user, "age");
// number
```

Здесь происходит сразу несколько шагов:

```text
T
↓
keyof T
↓
K must be one of those keys
↓
T[K]
```

Если:

```text
K = "name"
```

то:

```text
T[K] = string
```

Если:

```text
K = "age"
```

то:

```text
T[K] = number
```

Это уже не просто validation key-а. Мы сохраняем связь:

> **конкретный key → конкретный value type**

---

## Почему не просто `keyof T`

Можно написать:

```ts
function getProperty<T>(
  object: T,
  key: keyof T
) {
  return object[key];
}
```

Для такого типа:

```ts
type User = {
  id: string;
  age: number;
};
```

`keyof User`:

```ts
"id" | "age"
```

А return type становится примерно:

```ts
string | number
```

Потому что compiler знает только:

> key является каким-то ключом `User`.

Но не знает, каким именно.

С отдельным `K`:

```ts
function getProperty<
  T,
  K extends keyof T
>(
  object: T,
  key: K
): T[K]
```

вызов:

```ts
getProperty(user, "id")
```

фиксирует:

```text
K = "id"
```

и позволяет получить:

```text
T["id"]
→ string
```

Это один из лучших примеров того, зачем generics нужны не ради «универсальности», а ради **сохранения type relationship**.

---

## `keyof` работает не только со string keys

JavaScript property keys могут быть:

```text
string
number
symbol
```

Поэтому `keyof` не всегда возвращает только string literals.

Например:

```ts
type NumericMap = {
  0: string;
  1: string;
};

type Keys =
  keyof NumericMap;
```

Получатся numeric literal keys:

```ts
0 | 1
```

---

## Index signatures меняют `keyof`

Рассмотрим:

```ts
type Dictionary = {
  [key: string]: boolean;
};
```

Можно ожидать:

```ts
keyof Dictionary
// string
```

Но JavaScript object keys имеют особенность:

```ts
object[0]
```

фактически обращается к:

```ts
object["0"]
```

Поэтому для string index signature `keyof` может включать:

```ts
string | number
```

Это часто удивляет.

Conceptually:

```text
{ [key: string]: T }
↓
любая string key

но JS numeric property access
преобразуется в string

↓
keyof может быть string | number
```

Это важный нюанс при построении generic utility types.

---

## `keyof any`

Можно встретить:

```ts
type PropertyKey =
  keyof any;
```

Результат conceptually:

```ts
string | number | symbol
```

Это весь набор типов, которые JavaScript может использовать как property key.

В стандартной библиотеке уже существует:

```ts
PropertyKey
```

поэтому вручную писать `keyof any` обычно не требуется.

Но понимание полезно для type-level programming.

---

## `keyof` union может быть неожиданным

Рассмотрим:

```ts
type User = {
  id: string;
  name: string;
};

type Order = {
  id: string;
  total: number;
};

type Entity =
  User | Order;
```

Интуитивно можно ожидать:

```ts
keyof Entity
```

как:

```text
"id" | "name" | "total"
```

Но TypeScript должен учитывать:

> какие properties гарантированно доступны независимо от того, какой member union реально находится в переменной?

Общий гарантированный key:

```ts
"id"
```

Поэтому при работе с unions нужно помнить, что type system опирается на **safe shared structure**, а не просто складывает все возможные keys в один список.

Если нужны все keys members, часто используется отдельная distributive type-level technique — это уже advanced тема.

---

## `keyof` отлично подходит для configuration APIs

Например:

```ts
type AppConfig = {
  port: number;
  host: string;
  debug: boolean;
};

function readConfig<
  K extends keyof AppConfig
>(
  key: K
): AppConfig[K] {
  // ...
}
```

Теперь:

```ts
const port =
  readConfig("port");
// number

const debug =
  readConfig("debug");
// boolean
```

Caller получает autocomplete:

```text
port
host
debug
```

и правильный return type для каждого key.

Такой API значительно сильнее:

```ts
function readConfig(
  key: string
): unknown
```

---

## Не используй `keyof` только ради type cleverness

Допустим, тип фиксированный:

```ts
type User = {
  id: string;
  name: string;
};
```

И функция реально всегда принимает только:

```ts
"id" | "name"
```

Можно написать:

```ts
type UserKey =
  keyof User;
```

Это хорошо, если keys должны автоматически следовать за `User`.

Но если business API поддерживает только subset:

```text
name
```

а `id` менять запрещено, то:

```ts
keyof User
```

слишком широкий.

Правильнее:

```ts
type EditableUserField =
  "name";
```

или вычислить subset.

Это важный design principle:

> **`keyof` отражает structure, но structure не всегда равна business capability.**

То, что property существует, не означает, что API должен разрешать caller-у с ним работать.

---

## Вопросы на собеседовании

### Что делает `keyof`?

`keyof` получает object type и создаёт union его property keys. Это позволяет связывать API с реальной структурой типа вместо использования широкого `string`.

### Зачем писать `K extends keyof T`?

Чтобы generic parameter `K` мог принимать только keys объекта `T` и при этом сохранялся конкретный выбранный key. Это позволяет получить точный return type через `T[K]`.

### Чем `keyof T` отличается от `K extends keyof T`?

`keyof T` означает union всех допустимых keys. Отдельный `K` представляет конкретный member этого union и позволяет сохранить relationship между выбранным key и его value type.

### Почему `keyof` типа со string index signature может включать `number`?

Потому что в JavaScript numeric property access фактически преобразуется в string key. TypeScript учитывает это runtime behavior.

### Нужно ли использовать `keyof` для любого API, работающего с properties?

Нет. `keyof` отражает все structural keys, но business API может намеренно разрешать только subset этих properties.
