# 31. Template Literal Types

Template literal types позволяют строить **string literal types из других literal types**.

Syntax похож на обычный JavaScript template string:

```ts id="l11929"
type World = "world";

type Greeting =
  `hello ${World}`;
```

Результат:

```ts id="ciiz9g"
"hello world"
```

Но это происходит полностью в type system — runtime string не создаётся. Template literal types объединяют literal strings и разворачивают unions внутри interpolation.

Главная идея:

```text id="uhsufg"
string literal types
       ↓
template
       ↓
new string literal types
```

---

## Union внутри template автоматически расширяется

Например:

```ts id="w3f6b4"
type Entity =
  | "user"
  | "order";

type Action =
  | "created"
  | "deleted";

type EventName =
  `${Entity}.${Action}`;
```

Получаем:

```ts id="wyxeq3"
type EventName =
  | "user.created"
  | "user.deleted"
  | "order.created"
  | "order.deleted";
```

TypeScript строит все combinations.

Можно представить:

```text id="iv3sfr"
2 entities
×
2 actions
=
4 strings
```

Если interpolated positions содержат несколько unions, TypeScript создаёт cross product допустимых значений.

---

## Это сильнее обычного `string`

Представим event bus:

```ts id="56x1zr"
function subscribe(
  event: string,
  handler: () => void
) {
}
```

Caller может написать:

```ts id="4cqd8m"
subscribe(
  "banana.destroyed",
  () => {}
);
```

Compiler не знает, что event неправильный.

Можно определить:

```ts id="q6vrmc"
type Entity =
  | "user"
  | "order";

type Action =
  | "created"
  | "updated"
  | "deleted";

type EventName =
  `${Entity}.${Action}`;
```

Теперь:

```ts id="1esjw9"
function subscribe(
  event: EventName,
  handler: () => void
) {
}
```

Получаем autocomplete и compile-time validation:

```ts id="hz6mbr"
subscribe(
  "user.created",
  handler
); // OK

subscribe(
  "user.destroyed",
  handler
); // Error
```

---

## Template literal type особенно полезен, когда string имеет структуру

Например CSS-like units:

```ts id="vhfw9t"
type Size =
  `${number}px`;
```

Допустимо:

```ts id="ktr8up"
const width: Size = "120px";
```

Но:

```ts id="d5gihm"
const width: Size = "120";
// Error
```

Или percentages:

```ts id="yxs28g"
type Percentage =
  `${number}%`;
```

Routes:

```ts id="vlg6i4"
type ApiRoute =
  `/api/${string}`;
```

IDs:

```ts id="an2znb"
type UserId =
  `user_${string}`;

type OrderId =
  `order_${string}`;
```

Это не runtime validation, но type system уже может отличать string patterns.

---

## Structured string type не проверяет business semantics

Например:

```ts id="73qcw8"
type UserId =
  `user_${string}`;
```

такой value проходит:

```ts id="2w5qwr"
const id: UserId =
  "user_banana";
```

TypeScript проверяет только заданный string pattern:

```text id="xd2d49"
"user_"
+
any string
```

Он не знает:

* существует ли пользователь;
* UUID ли это;
* соответствует ли suffix database format.

Как всегда:

```text id="kn6a9s"
type-level constraint
≠
runtime/domain validation
```

---

## Один из лучших patterns — event names from object keys

Допустим:

```ts id="vjaryh"
type User = {
  name: string;
  age: number;
  active: boolean;
};
```

Хотим API:

```text id="j5m4ea"
nameChanged
ageChanged
activeChanged
```

Можно написать:

```ts id="7ylua2"
type UserEvent =
  `${keyof User & string}Changed`;
```

Результат:

```ts id="epw033"
"nameChanged"
| "ageChanged"
| "activeChanged"
```

Здесь:

```text id="klvawr"
keyof User
↓
"name" | "age" | "active"
↓
template literal
↓
"...Changed"
```

Это уже dynamic derivation из object shape.

---

## Ещё сильнее: сохранить связь event → property type

Можно построить typed API:

```ts id="24qesw"
type User = {
  name: string;
  age: number;
  active: boolean;
};

function on<
  K extends keyof User & string
>(
  event: `${K}Changed`,
  callback:
    (value: User[K]) => void
) {
  // ...
}
```

Теперь:

```ts id="2nccnw"
on(
  "nameChanged",
  value => {
    value.toUpperCase();
    // string
  }
);
```

А:

```ts id="8ndfd3"
on(
  "ageChanged",
  value => {
    value.toFixed();
    // number
  }
);
```

TypeScript связывает:

```text id="mjza8t"
"nameChanged"
↓
K = "name"
↓
User[K]
↓
string
```

Это один из лучших примеров того, как template literal types работают вместе с:

* generics;
* `keyof`;
* indexed access;
* inference.

Официальная документация приводит похожий pattern для strongly typed `"propertyChanged"` events.

---

## Key remapping + template literals

Mapped types позволяют переименовать properties:

```ts id="27fau5"
type Getters<T> = {
  [K in keyof T as
    `get${Capitalize<
      string & K
    >}`]:
      () => T[K];
};
```

Для:

```ts id="12dwjz"
type User = {
  name: string;
  age: number;
};
```

получаем:

```ts id="20n7kz"
type UserGetters = {
  getName: () => string;
  getAge: () => number;
};
```

Цепочка:

```text id="mknkn4"
keyof T
↓
K
↓
Capitalize<K>
↓
"get..."
↓
new property key
```

Вот здесь mapped types и template literal types становятся особенно мощной комбинацией.

---

## Intrinsic string manipulation types

TypeScript предоставляет встроенные transformations:

```ts id="1jn48s"
Uppercase<T>
Lowercase<T>
Capitalize<T>
Uncapitalize<T>
```

Например:

```ts id="g70xst"
type Method =
  | "get"
  | "post"
  | "delete";

type HttpMethod =
  Uppercase<Method>;
```

Результат:

```ts id="m82fy0"
"GET"
| "POST"
| "DELETE"
```

Или:

```ts id="lgjl8c"
type Field = "userName";

type Getter =
  `get${Capitalize<Field>}`;
// "getUserName"
```

Эти intrinsic transformations работают внутри type system; их string mapping не является locale-aware.

---

## Pattern matching string types через `infer`

Template literal types умеют работать и в обратную сторону.

Не только:

```text id="6ojnuc"
pieces
→ string
```

но и:

```text id="0um6hu"
string pattern
→ extract pieces
```

Например:

```ts id="orj9ow"
type ExtractEntity<T> =
  T extends
    `${infer Entity}.${string}`
      ? Entity
      : never;
```

Теперь:

```ts id="za74lc"
type A =
  ExtractEntity<
    "user.created"
  >;
// "user"

type B =
  ExtractEntity<
    "order.deleted"
  >;
// "order"
```

Pattern:

```text id="4ztsf5"
"user.created"
↓
`${infer Entity}.${string}`
↓
Entity = "user"
```

Это уже достаточно powerful type-level parsing.

---

## Можно извлечь несколько частей

```ts id="88rjpj"
type ParseEvent<T> =
  T extends
    `${infer Entity}.${infer Action}`
      ? [Entity, Action]
      : never;
```

Теперь:

```ts id="hm7dg2"
type Result =
  ParseEvent<
    "user.created"
  >;
```

получаем:

```ts id="cx2pch"
["user", "created"]
```

То есть `infer` работает не только с:

```ts id="qoq0pz"
Promise<infer T>
```

или function signatures.

Он может extract части template literal pattern.

---

## Реальный example: route parameters

Представим path:

```ts id="ppoxyo"
"/users/:userId"
```

Можно начать строить type-level parser:

```ts id="mlm6k0"
type ParamName<T> =
  T extends
    `${string}:${infer Param}`
      ? Param
      : never;
```

Теперь:

```ts id="yc3sts"
type Param =
  ParamName<
    "/users/:userId"
  >;
// "userId"
```

Для production router с несколькими parameters понадобится значительно более сложный recursive type.

Это хороший пример границы:

> TypeScript действительно способен такое делать, но это ещё не означает, что каждый application должен писать собственный type-level router parser.

Такие abstractions чаще оправданы внутри library/framework code.

---

## Cross product может быстро стать огромным

Допустим:

```ts id="5t6kvb"
type Locale =
  | "en"
  | "de"
  | "fr"
  | "ro";

type Section =
  | "home"
  | "user"
  | "orders"
  | "settings";

type Action =
  | "title"
  | "description"
  | "error"
  | "success";

type Key =
  `${Locale}.${Section}.${Action}`;
```

Compiler должен представить все combinations:

```text id="w7bm7d"
4 × 4 × 4
=
64 literals
```

С маленькими unions это отлично.

Но если inputs большие, resulting union может стать огромным и ухудшить:

* compiler performance;
* IDE responsiveness;
* error readability.

Для больших generated string sets иногда лучше code generation или более широкий branded/string contract, чем гигантский template-literal union.

---

## Template literal types должны моделировать реальный pattern

Хорошо:

```ts id="rdu9h1"
type EventName =
  `${Entity}.${Action}`;
```

если event naming convention реально является частью системы.

Хорошо:

```ts id="ospq9f"
type UserId =
  `user_${string}`;
```

если prefix имеет domain meaning.

Подозрительно:

```ts id="5pgf68"
type ExtremelySmartRouteType<
  T,
  U,
  V,
  ...
> = ...
```

если единственная причина — получить красивый autocomplete в одном internal helper-е.

Type-level parsing особенно легко переусложнить.

---

## Вопросы на собеседовании

### Что такое template literal type?

Это type-level string pattern, который позволяет создавать string literal types из других literal types и unions с помощью syntax, похожего на JavaScript template strings.

### Что происходит, если interpolation содержит union?

TypeScript создаёт все возможные combinations. Например:

```ts id="z8sbl5"
`${"user" | "order"}.${"created" | "deleted"}`
```

становится union из четырёх строк.

### Как template literal types связаны с `keyof`?

Можно получить keys object через `keyof`, а затем transform их в новые string literals, например `"name"` → `"nameChanged"`.

### Можно ли извлекать части строки через template literal types?

Да. В conditional type можно использовать `infer`:

```ts id="jtoh0k"
T extends
  `${infer A}.${infer B}`
    ? ...
    : ...
```

### Что делают `Capitalize`, `Uppercase`, `Lowercase` и `Uncapitalize`?

Это intrinsic string manipulation types, которые преобразуют string literal types на уровне compiler-а.

### Когда template literal types становятся плохим решением?

Когда создают огромные unions, сложный recursive parser или type logic, которую значительно труднее понять, чем runtime/API contract, который она моделирует.
