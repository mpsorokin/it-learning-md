# 36. `as const`

`as const` говорит TypeScript:

> **не расширяй literal values до более общих типов и рассматривай эту literal structure как readonly.**

Сравним:

```ts
const config = {
  environment: "production",
  retries: 3,
};
```

TypeScript выводит примерно:

```ts
{
  environment: string;
  retries: number;
}
```

Почему не:

```ts
{
  environment: "production";
  retries: 3;
}
```

Потому что properties mutable:

```ts
config.environment =
  "development";

config.retries = 10;
```

Теперь:

```ts
const config = {
  environment: "production",
  retries: 3,
} as const;
```

получаем:

```ts
{
  readonly environment:
    "production";

  readonly retries:
    3;
}
```

То есть const assertion сохраняет более точные literal types.

---

## `const variable` и `as const` — не одно и то же

Очень частая ошибка.

```ts
const user = {
  role: "admin",
};
```

`const` означает:

> variable `user` нельзя переназначить.

Нельзя:

```ts
user = anotherUser;
```

Но можно:

```ts
user.role = "user";
```

Поэтому:

```ts
user.role
```

обычно имеет тип:

```ts
string
```

Теперь:

```ts
const user = {
  role: "admin",
} as const;
```

получаем:

```ts
readonly role: "admin"
```

и:

```ts
user.role = "user";
// Error
```

То есть:

```text
const declaration
→ reference cannot be reassigned

as const
→ literal-preserving readonly inference
```

Это разные вещи.

---

## `as const` особенно важно для arrays

Обычный массив:

```ts
const roles = [
  "admin",
  "editor",
  "user",
];
```

выводится как:

```ts
string[]
```

TypeScript предполагает:

```ts
roles.push("something");
```

Поэтому нельзя считать список закрытым.

С:

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

Это уже tuple с точными literal values.

Теперь можно:

```ts
type Role =
  typeof roles[number];
```

и получить:

```ts
"admin"
| "editor"
| "user"
```

Один runtime source of truth:

```text
runtime array
↓
as const
↓
literal tuple
↓
typeof roles[number]
↓
union type
```

Это один из самых полезных modern TypeScript patterns.

---

## То же отлично работает с objects

Например:

```ts
const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;
```

Runtime:

```ts
HttpMethod.GET;
```

Type:

```ts
type HttpMethod =
  typeof HttpMethod[
    keyof typeof HttpMethod
  ];
```

Получаем:

```ts
"GET"
| "POST"
| "PUT"
| "DELETE"
```

Это часто является хорошей альтернативой enum для простых runtime constants.

Сам Handbook тоже показывает object + `as const` как современный вариант в случаях, где enum не обязателен.

---

## Почему без `as const` union не получится точным

Возьмём:

```ts
const Role = {
  ADMIN: "admin",
  USER: "user",
};
```

`typeof Role` примерно:

```ts
{
  ADMIN: string;
  USER: string;
}
```

Поэтому:

```ts
type RoleValue =
  typeof Role[
    keyof typeof Role
  ];
```

даёт:

```ts
string
```

С `as const`:

```ts
const Role = {
  ADMIN: "admin",
  USER: "user",
} as const;
```

получаем:

```text
ADMIN → "admin"
USER  → "user"
```

и итоговый union:

```ts
"admin" | "user"
```

---

## `as const` даёт readonly, но не runtime freeze

Очень важный нюанс.

```ts
const config = {
  host: "localhost",
} as const;
```

TypeScript запрещает:

```ts
config.host =
  "production";
```

Но `as const` не вызывает:

```ts
Object.freeze(config);
```

в JavaScript.

Это compile-time constraint.

Type assertion вообще не создаёт runtime transformation.

То есть:

```text
as const
→ TypeScript readonly view

Object.freeze()
→ runtime operation
```

Не нужно путать их.

---

## `as const` не является deep immutable system

Например:

```ts
const data = {
  user: {
    name: "Alex",
  },
} as const;
```

TypeScript применяет readonly inference к literal structure.

Но если внутрь literal попадает **уже существующий mutable reference**, ситуация другая:

```ts
const users = [
  { name: "Alex" },
];

const config = {
  users,
} as const;
```

`config.users` нельзя заменить:

```ts
config.users = [];
// Error
```

Но сам исходный mutable array:

```ts
users.push({
  name: "Maria",
});
```

остаётся mutable.

`as const` не клонирует object graph и не превращает все внешние references в runtime immutable data.

---

## `as const` полезен для discriminated unions

Представим action creator:

```ts
function createAction() {
  return {
    type: "user.created",
  };
}
```

В некоторых inference contexts `type` может widen до:

```ts
string
```

Но discriminated union хочет:

```ts
"user.created"
```

Можно:

```ts
function createAction() {
  return {
    type: "user.created",
  } as const;
}
```

Теперь return structure сохраняет literal discriminant.

Это особенно часто встречалось в Redux-style patterns и typed event systems.

---

## `as const` и `satisfies` решают разные проблемы

Представим:

```ts
type Routes =
  Record<
    "users" | "orders",
    string
  >;
```

Можно:

```ts
const routes = {
  users: "/users",
  orders: "/orders",
} as const;
```

Это сохраняет literals:

```text
"/users"
"/orders"
```

Но само по себе не говорит:

> object должен иметь exactly required Route keys.

`satisfies` решает compatibility checking:

```ts
const routes = {
  users: "/users",
  orders: "/orders",
} as const satisfies Routes;
```

Conceptually:

```text
as const
→ preserve narrow literal information

satisfies
→ verify contract
```

Их иногда полезно использовать вместе.

---

## Не нужно писать `as const` везде

Такое:

```ts
const user = {
  id: "u-1",
  name: "Alex",
} as const;
```

может быть совершенно лишним, если `user` представляет обычную mutable domain entity.

Теперь получаем overly narrow:

```text
id: "u-1"
name: "Alex"
```

вместо более естественного:

```text
id: string
name: string
```

и readonly properties.

`as const` хорошо подходит, когда literals действительно являются **частью contract**:

* fixed configuration;
* event names;
* permissions;
* routes;
* action types;
* finite value sets;
* static lookup tables.

Не для любого object literal.

---

## `as const` vs explicit literal annotation

Можно:

```ts
const status:
  "pending" = "pending";
```

Но:

```ts
const status =
  "pending" as const;
```

обычно проще.

Для object:

```ts
const config: {
  readonly mode: "production";
  readonly retries: 3;
} = {
  mode: "production",
  retries: 3,
};
```

явно повторяет весь literal type.

`as const` позволяет получить его из value автоматически.

---

## Современный generic API может использовать `const` type parameters

Иногда library author раньше заставлял caller писать:

```ts
createRoute(
  ["GET", "/users"] as const
);
```

Чтобы сохранить literal/tuple inference.

Современный TypeScript позволяет API author-у использовать `const` type parameter:

```ts
function identity<
  const T
>(value: T): T {
  return value;
}
```

Теперь literal-like argument может получить более narrow inference без `as const` на call site. Это отдельный механизм, добавленный для улучшения const-like inference в generic APIs.

Это не делает `as const` устаревшим.

Скорее:

```text
as const
→ caller controls inference

const type parameter
→ API author requests const-like inference
```

---

## Вопросы на собеседовании

### Что делает `as const`?

Он предотвращает обычное widening literal expressions и создаёт более точный readonly type. Object properties получают literal types, а array literals становятся readonly tuples.

### Чем `const` отличается от `as const`?

`const` запрещает переназначить variable binding, но object properties остаются mutable. `as const` влияет на TypeScript inference самой literal structure и делает её readonly на уровне типов.

### Делает ли `as const` объект immutable runtime?

Нет. Это compile-time type assertion. Он не вызывает `Object.freeze()` и не выполняет runtime transformation.

### Зачем `as const` часто используют с arrays?

Чтобы вместо `string[]` получить readonly tuple конкретных literals, после чего через `typeof array[number]` можно вывести union этих значений.

### Когда `as const` использовать не стоит?

Когда literal-specific type и readonly semantics не являются частью contract. Для обычной mutable entity слишком narrow inference только мешает.

### Чем `as const` отличается от `satisfies`?

`as const` в первую очередь управляет literal inference и readonly semantics. `satisfies` проверяет совместимость value с target type, сохраняя собственный inferred type value.
