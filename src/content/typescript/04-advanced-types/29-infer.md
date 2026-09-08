# 29. `infer`

`infer` позволяет **извлечь часть типа внутри conditional type и дать ей имя**.

Самый понятный пример — function return type.

Допустим:

```ts
type GetReturnType<T> =
  T extends (...args: any[]) => unknown
    ? ???
    : never;
```

Мы знаем:

> если `T` — function, нам нужен её return type.

Но заранее не знаем, какой именно.

`infer` позволяет TypeScript сказать:

> если shape совпал, сохрани эту часть как новый type variable.

```ts
type GetReturnType<T> =
  T extends (...args: any[]) => infer R
    ? R
    : never;
```

Теперь:

```ts
type A =
  GetReturnType<
    () => string
  >;
// string

type B =
  GetReturnType<
    (id: string) => Promise<User>
  >;
// Promise<User>
```

Главная mental model:

```text
T matches some type pattern
↓
infer captures part of that pattern
↓
use captured type
```

`infer` используется именно внутри conditional types для pattern-based type extraction. ([typescriptlang.org](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html?utm_source=chatgpt.com))

---

## `infer` — это pattern matching для types

Посмотрим на:

```ts
T extends Promise<infer R>
```

Это можно читать так:

> если `T` выглядит как `Promise<что-то>`, назови это `что-то` типом `R`.

Например:

```ts
type UnwrapPromise<T> =
  T extends Promise<infer R>
    ? R
    : T;
```

Теперь:

```ts
type A =
  UnwrapPromise<
    Promise<User>
  >;
// User

type B =
  UnwrapPromise<string>;
// string
```

Relationship:

```text
Promise<User>
↓
matches Promise<infer R>
↓
R = User
```

Это гораздо важнее запоминания самого keyword.

---

## `infer` можно использовать в function parameters

Например получить first parameter type:

```ts
type FirstParameter<T> =
  T extends (
    first: infer P,
    ...args: any[]
  ) => any
    ? P
    : never;
```

Использование:

```ts
type A =
  FirstParameter<
    (user: User, force: boolean) => void
  >;
```

Результат:

```ts
User
```

Мы pattern-match function signature:

```text
(first: P, ...)
↓
capture P
```

---

## Получить все parameters

```ts
type Params<T> =
  T extends (...args: infer P) => any
    ? P
    : never;
```

Для:

```ts
type Handler =
  (
    user: User,
    force: boolean
  ) => Promise<void>;
```

получаем:

```ts
type HandlerParams =
  Params<Handler>;
```

Результат:

```ts
[User, boolean]
```

То есть `infer` может захватывать не только один type, но и tuple.

Именно так conceptually работают стандартные utility types вроде `Parameters<T>`.

---

## Стандартный `ReturnType` построен на той же идее

Упрощённо:

```ts
type MyReturnType<T> =
  T extends (...args: any[]) => infer R
    ? R
    : never;
```

Использование:

```ts
function createUser() {
  return {
    id: "u-1",
    name: "Alex",
  };
}

type User =
  MyReturnType<typeof createUser>;
```

Теперь `User` выводится из реальной function signature.

Цепочка:

```text
runtime function
↓
typeof
↓
function type
↓
conditional pattern
↓
infer return
```

Это хороший пример композиции нескольких механизмов.

---

## `infer` особенно полезен для containers

Promise:

```ts
type PromiseValue<T> =
  T extends Promise<infer V>
    ? V
    : T;
```

Array:

```ts
type ArrayElement<T> =
  T extends readonly (infer E)[]
    ? E
    : T;
```

Например:

```ts
type A =
  ArrayElement<string[]>;
// string

type B =
  ArrayElement<User[]>;
// User
```

Conceptually:

```text
T[]
↓
infer element
↓
T
```

---

## То же можно написать через indexed access — и это важный trade-off

Для массива:

```ts
type Element<T extends readonly unknown[]> =
  T[number];
```

часто проще, чем:

```ts
type Element<T> =
  T extends readonly (infer E)[]
    ? E
    : never;
```

Оба могут решить похожую задачу.

Разница:

* indexed access проще, если вход уже гарантированно array;
* conditional + `infer` полезен, если нужно сначала проверить shape и только потом extract.

То есть не нужно использовать `infer` просто потому, что он выглядит advanced.

---

## Nested extraction

Можно извлекать тип глубже:

```ts
type ApiData<T> =
  T extends Promise<{
    data: infer D;
  }>
    ? D
    : never;
```

Для:

```ts
type Result =
  ApiData<
    Promise<{
      data: User[];
      requestId: string;
    }>
  >;
```

получаем:

```ts
User[]
```

Pattern:

```text
Promise<{
  data: D
}>
```

и TypeScript вытаскивает только `D`.

---

## Можно иметь несколько `infer`

```ts
type FunctionParts<T> =
  T extends (
    ...args: infer P
  ) => infer R
    ? {
        params: P;
        result: R;
      }
    : never;
```

Для:

```ts
type Handler =
  (
    id: string,
    force: boolean
  ) => Promise<User>;
```

получим:

```ts
{
  params: [string, boolean];
  result: Promise<User>;
}
```

Здесь одновременно извлекаются:

```text
parameters → P
return     → R
```

---

## `infer` variable существует только внутри branch

Такое:

```ts
type Extract<T> =
  T extends Promise<infer R>
    ? R
    : never;
```

`R` существует только там, где pattern match успешен.

Нельзя использовать его снаружи conditional type.

Conceptually:

```text
match success
↓
R available
```

Это локальная type variable.

---

## Recursive `infer`: deep Promise unwrap

Можно написать:

```ts
type DeepAwaited<T> =
  T extends Promise<infer R>
    ? DeepAwaited<R>
    : T;
```

Теперь:

```ts
type Result =
  DeepAwaited<
    Promise<
      Promise<User>
    >
  >;
```

получаем:

```ts
User
```

Type transformation выполняется recursively:

```text
Promise<Promise<User>>
↓
Promise<User>
↓
User
```

В реальном TypeScript стандартный `Awaited<T>` решает более полную версию подобной задачи.

Не нужно писать собственный `DeepAwaited` без причины, но пример отлично показывает возможности `infer`.

---

## `infer` и overloaded functions

Есть важный nuance.

Допустим:

```ts
function parse(value: string): number;
function parse(value: number): string;
function parse(
  value: string | number
): string | number {
  return typeof value === "string"
    ? Number(value)
    : String(value);
}
```

Если type utility пытается infer return type overloaded function:

```ts
type Result =
  ReturnType<typeof parse>;
```

TypeScript не выполняет полноценный overload resolution на уровне type query.

Inference обычно опирается на **последнюю overload signature**, которая должна быть наиболее общей.

Поэтому utilities с `infer` и overloaded functions могут давать результат, который сначала кажется неожиданным.

Это важный нюанс для library-level type design.

---

## `infer` может появляться в constrained form

Современный TypeScript позволяет в некоторых scenarios дополнительно ограничить inferred type.

Например idea:

```ts
type FirstString<T> =
  T extends [
    infer First extends string,
    ...unknown[]
  ]
    ? First
    : never;
```

Для:

```ts
type A =
  FirstString<
    ["hello", 123]
  >;
// "hello"
```

но:

```ts
type B =
  FirstString<
    [123, "hello"]
  >;
// never
```

Это комбинация:

```text
capture
+
constraint
```

Полезно в более сложном type-level programming, но в обычном application code встречается значительно реже.

---

## `infer` не нужно использовать, если type уже доступен напрямую

Плохая привычка:

```ts
type UserName<T> =
  T extends { name: infer N }
    ? N
    : never;
```

если API уже знает:

```ts
T extends { name: unknown }
```

и можно просто:

```ts
type UserName<T extends { name: unknown }> =
  T["name"];
```

Второе часто проще.

`infer` оправдан, когда нужная часть type **находится внутри pattern**, и прямой indexed access неудобен или невозможен.

---

## Реальный use case: extracting result from callback

```ts
type CallbackResult<T> =
  T extends (
    ...args: any[]
  ) => infer R
    ? R
    : never;
```

Например framework API:

```ts
type Handler =
  (
    request: Request
  ) => Promise<ResponseDto>;

type HandlerResult =
  CallbackResult<Handler>;
```

Получаем:

```ts
Promise<ResponseDto>
```

Дальше:

```ts
type ResolvedHandlerResult =
  Awaited<HandlerResult>;
```

получаем:

```ts
ResponseDto
```

Это уже вполне реальный pattern при построении typed framework abstractions.

---

## Когда `infer` становится плохой идеей

Если появляется:

```ts
type Magic<T> =
  T extends ...
    ? infer ...
      ? ...
      : ...
    : ...
```

и никто в команде не может быстро объяснить resulting type, type abstraction начинает работать против developer experience.

`infer` полезен для:

* extracting function parts;
* containers;
* tuples;
* Promise-like values;
* library utilities.

Но application code редко выигрывает от сложного type gymnastics ради одного endpoint.

Хороший rule:

> используй `infer`, когда можешь описать extraction простой фразой.

Например:

```text
"получи return type"
"вытащи element type"
"получи payload из Promise"
```

Если фраза сама занимает пять строк, возможно, design слишком сложный.

---

## Вопросы на собеседовании

### Что делает `infer`?

`infer` объявляет временный type variable внутри conditional type и позволяет извлечь часть типа, если вход соответствует заданному pattern.

### Где можно использовать `infer`?

В `extends`-части conditional type. Обычно он применяется для извлечения return type, function parameters, array elements, Promise values и других вложенных частей type structure.

### Как реализовать упрощённый `ReturnType`?

```ts
type MyReturnType<T> =
  T extends (...args: any[]) => infer R
    ? R
    : never;
```

`R` захватывает return type function.

### Чем `infer` отличается от indexed access?

Indexed access лучше, когда нужный property type уже доступен напрямую как `T[K]`. `infer` полезен, когда нужно pattern-match structure и извлечь часть неизвестного вложенного type.

### Можно ли использовать несколько `infer` в одном conditional type?

Да. Например можно одновременно извлечь function parameters и return type.

### Почему `infer` может вести себя неожиданно с overloads?

Потому что conditional inference не выполняет полноценный overload resolution для каждого call shape. При overloaded function inference обычно основывается на последней, наиболее общей overload signature.
