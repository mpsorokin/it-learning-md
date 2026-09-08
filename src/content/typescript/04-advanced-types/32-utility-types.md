# 32. Utility Types

Utility types — это готовые generic type transformations, встроенные в TypeScript.

Вместо того чтобы каждый раз писать:

```ts id="u2qcl2"
type Optional<T> = {
  [K in keyof T]?: T[K];
};
```

можно использовать стандартный:

```ts id="u8zr02"
Partial<T>
```

TypeScript предоставляет utilities для object shapes, unions, functions, constructors, promises и управления inference. Они доступны глобально.

Важно не просто запомнить список.

Полезнее понимать:

> **какую transformation каждый utility выражает и не создаёт ли он неправильный domain contract.**

---

## `Partial<T>`

Делает все properties optional:

```ts id="uw9lc2"
type User = {
  id: string;
  name: string;
  email: string;
};

type PartialUser =
  Partial<User>;
```

Получаем примерно:

```ts id="gq03jn"
{
  id?: string;
  name?: string;
  email?: string;
}
```

Частый use case — patch/update:

```ts id="if5k0g"
function updateUser(
  id: string,
  patch: Partial<User>
) {
  // ...
}
```

Но здесь есть architecture nuance.

Если `id` менять нельзя, `Partial<User>` слишком permissive:

```ts id="mol0za"
updateUser(
  "u-1",
  {
    id: "another-id",
  }
);
```

TypeScript разрешит это.

Лучше domain-specific update type:

```ts id="6qzbjr"
type UpdateUserInput =
  Partial<
    Pick<
      User,
      "name" | "email"
    >
  >;
```

Или описать contract явно.

Главная идея:

> `Partial<T>` означает «любой subset properties T», а не автоматически «правильный update DTO».

---

## `Required<T>`

Делает optional properties required:

```ts id="wpgen6"
type Config = {
  host?: string;
  port?: number;
};

type ResolvedConfig =
  Required<Config>;
```

Получаем:

```ts id="9u7dte"
{
  host: string;
  port: number;
}
```

Это хорошо отражает transformation:

```text id="6p7jvu"
raw config
↓
defaults applied
↓
resolved config
```

Например:

```ts id="salpgd"
function resolveConfig(
  input: Config
): Required<Config> {
  return {
    host:
      input.host ?? "localhost",
    port:
      input.port ?? 3000,
  };
}
```

---

## `Readonly<T>`

Делает properties readonly:

```ts id="u1b4ss"
type User = {
  id: string;
  name: string;
};

type ReadonlyUser =
  Readonly<User>;
```

Теперь:

```ts id="bbndyf"
user.name = "Maria";
// Error
```

Но `Readonly<T>` **shallow**.

```ts id="xpwty5"
type Order = {
  customer: {
    name: string;
  };
};

type ReadonlyOrder =
  Readonly<Order>;
```

Нельзя:

```ts id="op456e"
order.customer =
  anotherCustomer;
```

Но:

```ts id="fmggwg"
order.customer.name =
  "Maria";
```

может быть допустимо.

`Readonly<T>` не является `DeepReadonly<T>` и не вызывает `Object.freeze()` runtime.

---

## `Pick<T, K>`

Оставляет только выбранные properties:

```ts id="l08ylm"
type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

type PublicUser =
  Pick<
    User,
    "id" | "name"
  >;
```

Результат:

```ts id="a5y4ue"
{
  id: string;
  name: string;
}
```

Очень полезно для derived contracts.

Но здесь тоже нужно думать о coupling.

Если `PublicUser` — стабильный внешний API contract, иногда лучше описать его независимо:

```ts id="ce340e"
type PublicUserDto = {
  id: string;
  name: string;
};
```

Почему?

Потому что:

```ts id="rh40oj"
Pick<User, ...>
```

говорит:

> public contract зависит от internal `User`.

Иногда это идеально.

Иногда domain/storage model и transport contract должны изменяться независимо.

---

## `Omit<T, K>`

Делает противоположное:

```ts id="71mo3r"
type PublicUser =
  Omit<
    User,
    "passwordHash"
  >;
```

Остаётся всё, кроме `passwordHash`.

Это компактно.

Но для security-sensitive output есть потенциальный design problem.

Сегодня:

```ts id="03gdgl"
type User = {
  id: string;
  name: string;
  passwordHash: string;
};
```

```ts id="vp8h1v"
type PublicUser =
  Omit<
    User,
    "passwordHash"
  >;
```

Завтра в `User` добавили:

```ts id="yp26c7"
refreshToken: string;
```

`PublicUser` автоматически тоже получает его.

Для external/public DTO иногда безопаснее **allow-list**:

```ts id="a7hh89"
Pick<User, "id" | "name">
```

или explicit DTO,

чем deny-list:

```ts id="mu463l"
Omit<User, "passwordHash">
```

Это уже не вопрос syntax, а security/API design.

---

## `Record<K, V>`

Создаёт object type, у которого keys — `K`, а values — `V`.

```ts id="2l0eeh"
type Role =
  | "admin"
  | "editor"
  | "user";

type PermissionsByRole =
  Record<
    Role,
    string[]
  >;
```

Теперь object обязан иметь все keys:

```ts id="aw93j6"
const permissions:
  PermissionsByRole = {
    admin: ["*"],
    editor: ["read", "write"],
    user: ["read"],
  };
```

Если забыть:

```ts id="yopz1b"
user
```

получим ошибку.

Это сильнее, чем:

```ts id="557krp"
Record<string, string[]>
```

потому что конкретный finite key union даёт exhaustiveness.

---

## `Record<string, T>` не гарантирует существование каждого возможного key

Это важный нюанс.

```ts id="duhi5e"
const users:
  Record<string, User> = {};
```

Теперь:

```ts id="w63d2n"
users["does-not-exist"]
```

runtime вернёт:

```ts id="3erj0i"
undefined
```

Хотя слишком permissive indexed access typing может выглядеть как `User` без строгих настроек.

То есть:

```text id="zxj4vr"
Record<string, User>
```

не означает:

> для каждой возможной строки runtime существует User.

Это object с string index contract.

`noUncheckedIndexedAccess` помогает сделать отсутствие entries видимым в type system.

---

## `Exclude<T, U>`

Удаляет из union members, assignable to `U`:

```ts id="4kfj0h"
type Status =
  | "pending"
  | "paid"
  | "failed";

type ActiveStatus =
  Exclude<
    Status,
    "failed"
  >;
```

Результат:

```ts id="gyogqf"
"pending" | "paid"
```

Упрощённая implementation:

```ts id="89uvro"
type MyExclude<T, U> =
  T extends U
    ? never
    : T;
```

Это прямое применение distributive conditional types.

---

## `Extract<T, U>`

Оставляет только подходящие members:

```ts id="k34w39"
type Value =
  | string
  | number
  | (() => void);

type Functions =
  Extract<
    Value,
    (...args: any[]) => any
  >;
```

Результат:

```ts id="mqnxbj"
() => void
```

Conceptually:

```text id="02m5bd"
Exclude
→ remove matching

Extract
→ keep matching
```

---

## `NonNullable<T>`

Удаляет:

```text id="urukza"
null
undefined
```

из type:

```ts id="97rw1k"
type MaybeUser =
  User | null | undefined;

type UserOnly =
  NonNullable<MaybeUser>;
// User
```

Очень часто встречается с generic helpers:

```ts id="mr554w"
function isNonNullable<T>(
  value: T
): value is NonNullable<T> {
  return (
    value !== null &&
    value !== undefined
  );
}
```

После:

```ts id="zjvun6"
values.filter(
  isNonNullable
)
```

можно получить коллекцию без nullable members.

---

## `ReturnType<T>`

Получает return type функции:

```ts id="boc9mu"
function createUser() {
  return {
    id: "u-1",
    name: "Alex",
  };
}

type User =
  ReturnType<
    typeof createUser
  >;
```

Conceptually utility построена через `infer`:

```ts id="kudvy1"
type MyReturnType<T> =
  T extends
    (...args: any[]) =>
      infer R
        ? R
        : never;
```

Это полезно, когда function действительно является source of truth.

Но не нужно автоматически выводить все domain types из implementation functions.

Иногда contract должен существовать независимо.

---

## `Parameters<T>`

Получает parameters функции как tuple:

```ts id="k9nfdw"
function updateUser(
  id: string,
  patch: UpdateUserInput
) {
}
```

```ts id="n4lkxc"
type UpdateParams =
  Parameters<
    typeof updateUser
  >;
```

Результат:

```ts id="32fwdc"
[
  id: string,
  patch: UpdateUserInput
]
```

Полезно для:

* wrappers;
* decorators;
* higher-order functions;
* forwarding APIs.

Например:

```ts id="o7rndt"
function logged<
  T extends
    (...args: any[]) => any
>(
  fn: T
) {
  return (
    ...args: Parameters<T>
  ): ReturnType<T> => {
    console.log(args);
    return fn(...args);
  };
}
```

---

## `Awaited<T>`

Моделирует результат `await` и умеет recursively unwrap Promise-like types.

```ts id="yqilvs"
type A =
  Awaited<
    Promise<string>
  >;
// string
```

И:

```ts id="w117rt"
type B =
  Awaited<
    Promise<
      Promise<number>
    >
  >;
// number
```

Практический example:

```ts id="tnt8dr"
async function loadUser() {
  return repository.findById(
    "u-1"
  );
}

type LoadedUser =
  Awaited<
    ReturnType<
      typeof loadUser
    >
  >;
```

Получаем resolved result функции.

Цепочка:

```text id="5znfmh"
function
↓ typeof
function type
↓ ReturnType
Promise<...>
↓ Awaited
resolved type
```

---

## Constructor utilities

Есть также:

```ts id="i0yha0"
ConstructorParameters<T>
InstanceType<T>
```

Например:

```ts id="d4ehhp"
class UserService {
  constructor(
    repository: UserRepository,
    cache: Cache
  ) {}
}

type Args =
  ConstructorParameters<
    typeof UserService
  >;
```

получаем constructor parameters tuple.

А:

```ts id="ir60v9"
type Service =
  InstanceType<
    typeof UserService
  >;
```

получаем instance type `UserService`.

Это чаще встречается в library/framework code, reflection-like helpers и factories, чем в обычной business logic.

---

## `NoInfer<T>`

Более современный utility:

```ts id="ku3hxp"
NoInfer<T>
```

блокирует inference именно из конкретной позиции, не меняя сам resulting type. Он присутствует среди актуальных стандартных utility types TypeScript.

Например:

```ts id="mq3it2"
function createFSM<
  TState extends string
>(
  states: readonly TState[],
  initial:
    NoInfer<TState>
) {
}
```

Идея:

> `TState` должен выводиться из `states`, а `initial` должен **проверяться против уже выведенного TState**, а не расширять inference.

Например:

```ts id="1ys4xx"
createFSM(
  ["idle", "loading"] as const,
  "idle"
);
```

OK.

А:

```ts id="u5dcdt"
createFSM(
  ["idle", "loading"] as const,
  "banana"
);
```

должен быть rejected.

`NoInfer` нужен редко, но полезен при проектировании generic APIs, когда compiler получает слишком много competing inference sources.

---

## Utility types можно комбинировать, но осторожно

Например:

```ts id="1o31ov"
type UpdateUserInput =
  Partial<
    Pick<
      User,
      "name" | "email"
    >
  >;
```

Читается нормально:

```text id="ncz7z0"
User
↓
take name + email
↓
make them optional
```

Но:

```ts id="zgq2l6"
type Something =
  Readonly<
    Partial<
      Omit<
        Required<
          Pick<
            ...
```

уже может быть хуже explicit type.

Utility types должны помогать developer-у быстро понять transformation.

Если для расшифровки типа нужно мысленно выполнить шесть операций, abstraction перестаёт экономить complexity.

---

## Derived type vs independent contract

Это одна из самых важных практических тем utility types.

Например:

```ts id="liqm7e"
type CreateUserDto =
  Omit<
    User,
    "id" | "createdAt"
  >;
```

Кажется удобно.

Но означает:

> Create DTO автоматически зависит от full `User`.

Если позже в `User` появляется:

```ts id="cr0bmh"
isBlocked: boolean;
```

поле автоматически попадёт и в `CreateUserDto`, если его отдельно не исключили.

Возможно, это ошибка.

Иногда правильнее:

```ts id="7iprlb"
type CreateUserDto = {
  name: string;
  email: string;
};
```

Да, properties немного дублируются.

Но contracts имеют разные owners и reasons to change.

Это хорошая Senior-level мысль:

> **DRY для types не важнее правильных boundaries.**

---

## Utility type не меняет runtime object

Например:

```ts id="zf465n"
type PublicUser =
  Omit<
    User,
    "passwordHash"
  >;
```

не удаляет `passwordHash` из объекта runtime.

Такой код:

```ts id="7kb865"
const user: User =
  await repository.find();

const publicUser:
  PublicUser = user;
```

не обязательно создаёт новый sanitized object.

Runtime `user` всё ещё может содержать `passwordHash`.

Если потом:

```ts id="6wi5q6"
JSON.stringify(publicUser)
```

TypeScript type сам по себе property не удалит.

Для реальной serialization boundary нужно runtime transformation:

```ts id="4s6wws"
const {
  passwordHash,
  ...publicUser
} = user;
```

Это критически важное различие:

```text id="47zrqq"
Omit<T, K>
→ compile-time view

object destructuring / mapper
→ runtime transformation
```

Особенно для security-sensitive DTO.

---

## Не надо запоминать реализации всех utilities

Важно понимать underlying mechanisms:

```text id="b18dzn"
Partial
Required
Readonly
→ mapped types

Pick
→ mapped type over selected keys

Exclude
Extract
NonNullable
→ conditional/distributive types

ReturnType
Parameters
→ conditional types + infer

Awaited
→ conditional + recursive unwrapping
```

Если ты понимаешь:

* generics;
* `keyof`;
* indexed access;
* mapped types;
* conditional types;
* `infer`;
* distributivity;

большинство utility types перестают быть магией.

Именно это является реальной целью этого блока.

---

## Вопросы на собеседовании

### Что такое utility types?

Это встроенные generic type transformations TypeScript для распространённых операций: сделать properties optional/readonly, выбрать или исключить поля, преобразовать union, извлечь parameters или return type функции и т.д.

### Чем `Pick` отличается от `Omit`?

`Pick<T, K>` строит type только из перечисленных keys. `Omit<T, K>` берёт `T` и исключает перечисленные keys.

Для public/security contracts `Pick` иногда безопаснее концептуально, потому что это allow-list, а `Omit` — deny-list.

### Делает ли `Readonly<T>` объект immutable runtime?

Нет. Это compile-time и shallow transformation. Он не вызывает `Object.freeze()` и не делает nested objects автоматически readonly.

### Можно ли использовать `Partial<User>` как update DTO?

Можно, если действительно разрешено изменять любое поле `User`. Но часто это слишком широкий contract — например `id`, `createdAt` или system-controlled fields обновлять нельзя.

### Что делает `Record<K, V>`?

Создаёт object type, где каждый key из `K` связан с value type `V`. Особенно полезен с finite literal union, потому что TypeScript может проверить наличие всех required keys.

### Как работают `Exclude` и `Extract`?

Они используют distributive conditional types. `Exclude` удаляет matching union members, а `Extract` оставляет их.

### Как реализован `ReturnType` conceptually?

Через conditional type и `infer`:

```ts id="e6j20j"
T extends
  (...args: any[]) => infer R
    ? R
    : never
```

### Что делает `Awaited<T>`?

Моделирует результат `await`, включая recursive unwrapping вложенных Promise-like типов.

### Что такое `NoInfer<T>`?

Он не меняет type `T`, но блокирует inference из конкретной позиции. Это полезно для generic API, когда один argument должен проверяться против type parameter, выведенного из другого argument.

### Удаляет ли `Omit<User, "passwordHash">` поле из runtime object?

Нет. `Omit` меняет только compile-time type. Для реального удаления sensitive field нужен runtime mapping/destructuring/serialization logic.
