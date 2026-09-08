# 26. Indexed Access Types

Indexed access type позволяет получить type конкретного property из другого типа.

```ts
type User = {
  id: string;
  name: string;
  age: number;
};

type UserName =
  User["name"];
```

Результат:

```ts
string
```

Это type-level аналог идеи:

```ts
user["name"]
```

но никакого runtime access не происходит.

```text
object type
   ↓
["property"]
   ↓
property type
```

---

## Можно получать несколько properties через union keys

```ts
type User = {
  id: string;
  name: string;
  age: number;
};

type Value =
  User["name" | "age"];
```

Получаем:

```ts
string | number
```

Потому что:

```text
User["name"] → string
User["age"]  → number
```

а вместе:

```text
string | number
```

---

## `T[keyof T]` означает union всех value types

Очень важный pattern:

```ts
type User = {
  id: string;
  age: number;
  active: boolean;
};

type UserValue =
  User[keyof User];
```

Сначала:

```ts
keyof User
```

даёт:

```ts
"id" | "age" | "active"
```

Дальше:

```ts
User[
  "id" | "age" | "active"
]
```

даёт:

```ts
string | number | boolean
```

То есть:

```text
T
↓
keyof T
↓
all keys
↓
T[keyof T]
↓
all possible value types
```

---

## Это основа точных generic property APIs

Возвращаемся к:

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

Здесь `T[K]` — indexed access type.

Допустим:

```ts
const user = {
  id: "u-1",
  age: 30,
  active: true,
};
```

Вызов:

```ts
const age =
  getProperty(user, "age");
```

Inference:

```text
T = typeof user
K = "age"
T[K] = number
```

Поэтому return:

```ts
number
```

Без indexed access пришлось бы возвращать слишком широкий union:

```ts
string | number | boolean
```

или `unknown`.

`T[K]` позволяет выразить точную зависимость:

> тип результата равен типу property, выбранного caller-ом.

---

## Indexed access хорошо убирает дублирование

Представим:

```ts
type User = {
  id: string;
  profile: {
    name: string;
    avatarUrl: string | null;
  };
};
```

Можно написать отдельно:

```ts
type UserProfile = {
  name: string;
  avatarUrl: string | null;
};
```

Но если profile уже определён внутри `User` и именно `User` должен быть source of truth:

```ts
type UserProfile =
  User["profile"];
```

Теперь при изменении:

```ts
profile: {
  name: string;
  avatarUrl: string | null;
  bio: string;
}
```

`UserProfile` обновится автоматически.

---

## Можно индексироваться глубже

```ts
type AvatarUrl =
  User["profile"]["avatarUrl"];
```

Результат:

```ts
string | null
```

Это удобно для небольших derived types.

Но если код превращается в:

```ts
type X =
  AppState["users"]["entities"][number]["profile"]["settings"]["theme"];
```

возможно, type graph стал слишком связанным.

Type-level access может убрать duplication, но также создать сильную coupling между внутренними structures.

---

## Arrays тоже можно индексировать

Представим:

```ts
type Users = User[];
```

Что такое:

```ts
Users[number]
```

?

Любой numeric index массива возвращает element type.

Поэтому:

```ts
type UserItem =
  Users[number];
```

получаем:

```ts
User
```

Это один из самых полезных patterns TypeScript.

---

## Runtime array → element union

Ещё интереснее:

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

даёт readonly tuple:

```ts
readonly [
  "admin",
  "editor",
  "user"
]
```

Теперь:

```ts
type Role =
  typeof roles[number];
```

получаем:

```ts
"admin" | "editor" | "user"
```

Почему работает `[number]`?

Tuple — это специализированный array type.

Индекс:

```ts
number
```

означает:

> дай type любого элемента, доступного по numeric index.

Поэтому union всех tuple elements:

```text
"admin"
|
"editor"
|
"user"
```

---

## То же работает с массивом объектов

```ts
const routes = [
  {
    method: "GET",
    path: "/users",
  },
  {
    method: "POST",
    path: "/users",
  },
] as const;
```

Element type:

```ts
type Route =
  typeof routes[number];
```

Получаем union объектов tuple:

```ts
{
  readonly method: "GET";
  readonly path: "/users";
}
|
{
  readonly method: "POST";
  readonly path: "/users";
}
```

Дальше:

```ts
type Method =
  Route["method"];
```

Результат:

```ts
"GET" | "POST"
```

Получается цепочка:

```text
runtime data
↓
typeof
↓
array/tuple type
↓
[number]
↓
element type
↓
["method"]
↓
property union
```

Это уже реальная композиция нескольких type-system mechanisms.

---

## Key должен существовать

Нельзя:

```ts
type User = {
  id: string;
};

type Email =
  User["email"];
```

TypeScript выдаст ошибку.

И это хорошо: type-level access проверяется так же строго, как ожидается от normal property contract.

С generic key для этого используется constraint:

```ts
K extends keyof T
```

Если просто написать:

```ts
type Value<T, K> = T[K];
```

compiler возразит, потому что произвольный `K` не гарантированно является valid property key для `T`.

Правильно:

```ts
type Value<
  T,
  K extends keyof T
> = T[K];
```

---

## Optional property сохраняет `undefined`

```ts
type User = {
  id: string;
  nickname?: string;
};
```

Теперь:

```ts
type Nickname =
  User["nickname"];
```

может включать:

```ts
string | undefined
```

потому что type property сам моделирует возможность отсутствия.

Indexed access не «очищает» тип — он получает type property таким, каким он определён.

---

## Index signatures тоже участвуют

```ts
type Scores = {
  [username: string]: number;
};
```

Можно получить:

```ts
type Score =
  Scores[string];
```

Результат:

```ts
number
```

Потому что любой допустимый string key должен вести к `number`.

---

## Indexed access vs `typeof value.property`

Иногда оба способа приводят к похожему результату.

```ts
const user = {
  id: "u-1",
  age: 30,
};

type A =
  typeof user.age;
```

и:

```ts
type B =
  typeof user["age"];
```

Но когда уже есть type:

```ts
type User = ...
```

indexed access:

```ts
User["age"]
```

работает напрямую на type level без необходимости иметь runtime value.

То есть:

```text
typeof
→ value → type

indexed access
→ type → another type
```

---

## Не всегда нужно derive всё из одного giant type

Допустим:

```ts
type User =
  ApiResponse["data"]["users"][number]["profile"];
```

Это автоматически синхронизируется с `ApiResponse`.

Но теперь изменение transport structure может неожиданно изменить domain type.

Иногда лучше:

```ts
type UserProfile = {
  ...
};
```

и уже API ссылается на `UserProfile`.

То есть нужно выбирать direction зависимости.

Хорошо:

```text
domain type
↓
API uses it
```

если domain является source of truth.

Хорошо:

```text
constant configuration
↓
derive type
```

если runtime config является source of truth.

Плохо:

> derive всё из всего, лишь бы не повторить три свойства.

Type reuse не должна создавать неправильную architectural coupling.

---

## Вопросы на собеседовании

### Что такое indexed access type?

Это способ получить type property из другого type через syntax `T[K]`. Например `User["name"]` возвращает type свойства `name`.

### Что означает `T[keyof T]`?

Это union типов всех properties `T`. `keyof T` создаёт union keys, а indexed access получает соответствующие value types.

### Что означает `T[number]` для массива?

Это element type массива. Для tuple `T[number]` создаёт union типов всех элементов tuple.

### Почему `typeof roles[number]` часто используется вместе с `as const`?

`as const` сохраняет конкретные literal elements как readonly tuple, `typeof` получает tuple type, а `[number]` извлекает union его элементов.

### Почему в generic utility нужен `K extends keyof T`?

Потому что `T[K]` допустим только если compiler знает, что `K` является valid key для `T`. Constraint одновременно обеспечивает безопасность и сохраняет relationship между key и value type.

### Всегда ли хорошо выводить nested type через indexed access?

Нет. Это уменьшает duplication, но может создать сильную coupling между слоями. Если nested structure является отдельным domain concept, иногда лучше дать ей собственный независимый type.
