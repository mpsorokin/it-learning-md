# 28. Conditional Types

Conditional type — это **if-expression внутри type system**.

Базовый syntax:

```ts
T extends U ? X : Y
```

Например:

```ts
type IsString<T> =
  T extends string
    ? true
    : false;
```

Теперь:

```ts
type A = IsString<string>;
// true

type B = IsString<number>;
// false
```

Conceptually:

```text
T assignable to U?
      ↓
yes → X
no  → Y
```

Conditional types позволяют type result зависеть от input type. ([typescriptlang.org](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html?utm_source=chatgpt.com))

---

## Conditional type полезен, когда result type зависит от shape input type

Простой example:

```ts
type ApiResult<T> =
  T extends Error
    ? { ok: false; error: T }
    : { ok: true; data: T };
```

Теперь:

```ts
type UserResult =
  ApiResult<User>;
```

получаем:

```ts
{
  ok: true;
  data: User;
}
```

А:

```ts
type ErrorResult =
  ApiResult<ValidationError>;
```

получаем:

```ts
{
  ok: false;
  error: ValidationError;
}
```

Type transformation меняется в зависимости от `T`.

---

## `extends` здесь означает assignability check

Важно не воспринимать:

```ts
T extends U
```

только как generic constraint.

В conditional type это вопрос:

> можно ли `T` присвоить `U`?

Например:

```ts
type IsArray<T> =
  T extends readonly unknown[]
    ? true
    : false;
```

Тогда:

```ts
type A = IsArray<string[]>;
// true

type B = IsArray<string>;
// false
```

---

## Реальный example: unwrap Promise

Допустим, хотим получить внутренний value type:

```ts
type UnwrapPromise<T> =
  T extends Promise<string>
    ? string
    : T;
```

Это работает только для `Promise<string>`.

Но нам нужен generic relationship:

```text
Promise<X>
↓
X
```

Для этого позже понадобится `infer`.

Пока важно понять сам conditional:

```ts
type Result<T> =
  T extends Promise<unknown>
    ? ...
    : T;
```

Сначала TypeScript выбирает branch на основании input type.

---

## Conditional type может возвращать `never`

Очень распространённый pattern:

```ts
type OnlyStrings<T> =
  T extends string
    ? T
    : never;
```

Для:

```ts
type A = OnlyStrings<string>;
// string

type B = OnlyStrings<number>;
// never
```

Особенно интересно становится с unions:

```ts
type Result =
  OnlyStrings<
    string | number | boolean
  >;
```

Результат:

```ts
string
```

Почему это происходит — отдельная тема про distributive conditional types.

Но уже здесь полезно понимать:

```text
неподходящий type
↓
never
↓
не участвует в результате
```

---

## Conditional type может выбирать разные structures

Например API:

```ts
type ResponseFor<T> =
  T extends "user"
    ? User
    : T extends "order"
      ? Order
      : never;
```

Теперь:

```ts
type A =
  ResponseFor<"user">;
// User

type B =
  ResponseFor<"order">;
// Order
```

Технически это работает.

Но большое количество nested conditions:

```ts
T extends A
  ? ...
  : T extends B
    ? ...
    : T extends C
      ? ...
```

быстро становится трудным для чтения.

Если relation — просто static mapping, иногда object lookup type читается лучше:

```ts
type EntityMap = {
  user: User;
  order: Order;
};

type ResponseFor<
  T extends keyof EntityMap
> = EntityMap[T];
```

Это важный Senior trade-off:

> conditional type не всегда лучший инструмент только потому, что result зависит от input.

---

## Conditional types особенно хорошо работают внутри generic utilities

Например:

```ts
type ElementType<T> =
  T extends readonly unknown[]
    ? T[number]
    : T;
```

Теперь:

```ts
type A =
  ElementType<string[]>;
// string

type B =
  ElementType<number[]>;
// number

type C =
  ElementType<Date>;
// Date
```

Логика читается довольно естественно:

```text
если T — array
→ взять element type

иначе
→ оставить T
```

---

## Conditional type может проверять object shape

```ts
type HasId<T> =
  T extends { id: unknown }
    ? true
    : false;
```

Например:

```ts
type A =
  HasId<User>;
// true

type B =
  HasId<string>;
// false
```

Это structural check.

Не важно, объявлен ли `User implements Something`.

Важно, совместим ли его shape с:

```ts
{ id: unknown }
```

---

## Conditional type и API design

Иногда встречается слишком clever API:

```ts
function fetchEntity<
  T extends "user" | "order"
>(
  type: T
): Promise<
  T extends "user"
    ? User
    : Order
> {
  // ...
}
```

Caller получает точный type:

```ts
const user =
  await fetchEntity("user");
// User
```

Это может быть удобно.

Но для двух вариантов overloads:

```ts
function fetchEntity(
  type: "user"
): Promise<User>;

function fetchEntity(
  type: "order"
): Promise<Order>;
```

могут читаться проще.

Conditional type выигрывает, когда relationship действительно scalable.

Overloads — когда вариантов мало и они понятны как отдельные call shapes.

---

## Conditional types могут усложнять implementation

В signature:

```ts
function convert<T>(
  value: T
): T extends string
  ? number
  : string
```

caller type выглядит красиво.

Но implementation compiler-у часто трудно доказать, что конкретный runtime branch соответствует условному return type:

```ts
function convert<T>(
  value: T
): T extends string
  ? number
  : string {
  if (typeof value === "string") {
    return Number(value);
    // TypeScript может потребовать help
  }

  return String(value);
}
```

Причина в том, что generic `T` и runtime narrowing generic parameters не всегда вычисляются так просто, как developer ожидает.

Это важный практический нюанс:

> conditional return types часто проще для consumers, чем для implementation.

Иногда overload signatures поверх простой implementation являются более maintainable design.

---

## Nested conditional types

Можно написать:

```ts
type TypeName<T> =
  T extends string
    ? "string"
    : T extends number
      ? "number"
      : T extends boolean
        ? "boolean"
        : "other";
```

Работает:

```ts
type A = TypeName<string>;
// "string"

type B = TypeName<Date>;
// "other"
```

Но readability быстро падает.

Если conditional chain длинная, стоит проверить:

* можно ли использовать mapping;
* можно ли разделить transformation;
* действительно ли type-level branching нужен.

---

## Conditional type — это compile-time logic, не runtime logic

Такое:

```ts
type Result<T> =
  T extends string
    ? number
    : boolean;
```

никак не создаёт JavaScript `if`.

Runtime function всё равно должна самостоятельно реализовать соответствующее behavior.

Type system только описывает relationship.

Это особенно важно, если input приходит runtime:

```ts
const value =
  JSON.parse(input);
```

Conditional type не валидирует его.

---

## Вопросы на собеседовании

### Что такое conditional type?

Это type-level expression вида `T extends U ? X : Y`, который выбирает один из двух типов в зависимости от assignability relationship между `T` и `U`.

### Что означает `extends` в conditional type?

Это проверка assignability: соответствует ли `T` типу `U`. Это не обязательно inheritance.

### Зачем conditional types возвращают `never`?

`never` удобно использовать для фильтрации неподходящих types. Особенно это важно с distributive conditional types и unions.

### Когда conditional type лучше overload?

Когда существует scalable generic rule между input и output. Если вариантов немного и каждый представляет отдельный call shape, overload часто проще читать.

### Какой главный риск conditional types?

Слишком сложные conditional chains ухудшают readability, error messages и maintainability. Type transformation должна быть проще для понимания, чем ручное описание альтернатив.
