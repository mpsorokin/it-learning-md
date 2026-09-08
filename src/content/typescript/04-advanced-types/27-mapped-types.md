# 27. Mapped Types

Mapped type позволяет **построить новый object type, пройдясь по keys другого type**.

Базовый пример:

```ts
type User = {
  id: string;
  name: string;
  active: boolean;
};

type OptionalUser = {
  [K in keyof User]?: User[K];
};
```

Результат:

```ts
type OptionalUser = {
  id?: string;
  name?: string;
  active?: boolean;
};
```

Главная идея:

```text
keyof T
↓
получили все keys
↓
[K in keyof T]
↓
прошли по каждому key
↓
T[K]
↓
сохранили value type
```

Mapped types — это фундамент, на котором построены многие стандартные utility types вроде `Partial`, `Readonly` и `Required`. ([typescriptlang.org](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html?utm_source=chatgpt.com))

---

## Самый важный pattern

Generic version:

```ts
type Optional<T> = {
  [K in keyof T]?: T[K];
};
```

Теперь:

```ts
type OptionalUser = Optional<User>;
```

и:

```ts
type OptionalOrder = Optional<Order>;
```

работают по одному правилу.

Это уже не просто alias.

Мы описываем **type transformation**:

```text
T
↓
тот же набор properties
↓
каждый property становится optional
```

---

## Mapped type сохраняет связь key → value type

Важно не просто пройтись по keys, а взять правильный тип каждого property:

```ts
type User = {
  id: string;
  age: number;
  active: boolean;
};
```

Mapped type:

```ts
type Copy<T> = {
  [K in keyof T]: T[K];
};
```

получит:

```ts
{
  id: string;
  age: number;
  active: boolean;
}
```

Не:

```ts
{
  id: string | number | boolean;
  age: string | number | boolean;
  active: string | number | boolean;
}
```

Потому что для каждого конкретного `K` используется конкретный:

```ts
T[K]
```

Это важная relationship.

---

## Можно добавлять modifiers

Например сделать все properties `readonly`:

```ts
type ReadonlyObject<T> = {
  readonly [K in keyof T]: T[K];
};
```

Использование:

```ts
type ReadonlyUser =
  ReadonlyObject<User>;
```

Теперь:

```ts
const user: ReadonlyUser = {
  id: "u-1",
  name: "Alex",
  active: true,
};

user.name = "Maria";
// Error
```

---

## Можно удалять modifiers

Mapped types умеют не только добавлять, но и снимать `readonly` или optionality.

Например:

```ts
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
```

Если:

```ts
type Config = {
  readonly host: string;
  readonly port: number;
};
```

то:

```ts
type MutableConfig =
  Mutable<Config>;
```

получим:

```ts
{
  host: string;
  port: number;
}
```

То же с optional:

```ts
type RequiredObject<T> = {
  [K in keyof T]-?: T[K];
};
```

`-?` означает:

> убери optional modifier.

---

## Mapped type — это не runtime loop

Синтаксис:

```ts
[K in keyof T]
```

выглядит как цикл.

Но никакого JavaScript-кода не генерируется.

Это полностью compile-time operation:

```text
type input
↓
compiler transforms it
↓
new type
```

Runtime object не изменяется.

---

## Реальный example: permissions

Допустим, есть actions:

```ts
type UserActions =
  | "create"
  | "read"
  | "update"
  | "delete";
```

Можно создать permission map:

```ts
type Permissions = {
  [K in UserActions]: boolean;
};
```

Получаем:

```ts
type Permissions = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};
```

Если добавить новый action:

```ts
type UserActions =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "archive";
```

`Permissions` автоматически потребует:

```ts
archive: boolean
```

Это сильнее, чем вручную поддерживать два независимых списка.

---

## Mapped type может работать не только с `keyof`

Можно map-ить любой union допустимых property keys:

```ts
type Environment =
  | "development"
  | "staging"
  | "production";

type ConfigByEnvironment = {
  [E in Environment]: AppConfig;
};
```

Получаем:

```ts
{
  development: AppConfig;
  staging: AppConfig;
  production: AppConfig;
}
```

То есть mapped type conceptually:

```text
union of keys
↓
build object type
```

---

## Key remapping

Более advanced possibility — изменить names properties через `as`.

```ts
type Getters<T> = {
  [K in keyof T as
    `get${Capitalize<string & K>}`]:
      () => T[K];
};
```

Для:

```ts
type User = {
  name: string;
  age: number;
};
```

получаем:

```ts
type UserGetters = {
  getName: () => string;
  getAge: () => number;
};
```

Здесь сразу работают:

* `keyof`;
* mapped types;
* template literal types;
* indexed access.

Это хороший пример того, как TypeScript mechanisms начинают композиционно работать вместе.

---

## Можно удалять keys через `never`

Например:

```ts
type RemoveId<T> = {
  [K in keyof T as
    K extends "id" ? never : K]:
      T[K];
};
```

Для:

```ts
type User = {
  id: string;
  name: string;
  age: number;
};
```

получим:

```ts
{
  name: string;
  age: number;
}
```

Почему?

Когда remapped key становится:

```ts
never
```

он исчезает из результирующего object type.

Позже это будет легче понимать после conditional types.

---

## Не делай mapped type сложнее business model

Технически можно построить:

```ts
type DeepOptionalReadonlyNullableSomething<T> = {
  ...
};
```

Но если developer должен пять минут вычислять resulting type в голове, utility уже может вредить DX.

Mapped types полезны, когда transformation выражается простой фразой:

```text
all fields optional
all fields readonly
all keys become getters
all statuses become handlers
```

Если rule невозможно коротко объяснить, возможно, abstraction слишком умная.

---

## Mapped types хорошо подходят для синхронизации contracts

Например event handlers:

```ts
type Events = {
  "user.created": UserCreatedEvent;
  "user.deleted": UserDeletedEvent;
};

type EventHandlers = {
  [K in keyof Events]:
    (event: Events[K]) => void;
};
```

Получаем:

```ts
{
  "user.created":
    (event: UserCreatedEvent) => void;

  "user.deleted":
    (event: UserDeletedEvent) => void;
}
```

Если в `Events` добавили новый event, TypeScript автоматически потребует corresponding handler.

Это уже хороший real-world use case для type-level programming.

---

## Вопросы на собеседовании

### Что такое mapped type?

Mapped type создаёт новый object type, проходя по union keys и вычисляя type каждого property. Чаще всего source keys берутся через `keyof T`.

### Что означает `[K in keyof T]`?

`K` по очереди представляет каждый key объекта `T`. Внутри можно использовать `T[K]`, чтобы получить type конкретного property.

### Как работают `readonly` и `?` в mapped types?

Их можно добавлять или удалять:

```ts
readonly
?
-readonly
-?
```

Это позволяет строить transformations вроде `Readonly<T>` и `Required<T>`.

### Что такое key remapping?

Это возможность изменить или удалить property key через `as`:

```ts
[K in keyof T as NewKey]
```

Если `NewKey` становится `never`, property удаляется.

### Когда mapped type становится плохой идеей?

Когда transformation слишком сложная и ухудшает readability, inference или error messages. Type-level abstraction должна упрощать API, а не просто демонстрировать возможности compiler-а.
