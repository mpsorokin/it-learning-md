# 30. Distributive Conditional Types

Conditional type становится **distributive**, когда условие применяется к generic type parameter и в него передают union.

Например:

```ts id="1xurhs"
type ToArray<T> =
  T extends unknown
    ? T[]
    : never;
```

Если передать обычный тип:

```ts id="rjau9l"
type A = ToArray<string>;
// string[]
```

ничего необычного.

Но если передать union:

```ts id="dg6sk5"
type B =
  ToArray<string | number>;
```

результат:

```ts id="glsaqo"
string[] | number[]
```

а **не**:

```ts id="uqmx4u"
(string | number)[]
```

Почему?

TypeScript применяет conditional type отдельно к каждому member union. Это стандартное поведение distributive conditional types.

Conceptually:

```text id="xclu74"
ToArray<string | number>

↓

ToArray<string>
|
ToArray<number>

↓

string[]
|
number[]
```

Это одна из тех TypeScript-механик, которая сначала выглядит странно, но после понимания становится очень предсказуемой.

---

## Distribution возникает из-за `T`, а не просто из-за union

Ключевой pattern:

```ts id="zw5um2"
T extends Something
  ? X
  : Y
```

Здесь `T` используется непосредственно слева от `extends`.

Такой type parameter иногда называют **naked type parameter**.

Например:

```ts id="kferjl"
type IsString<T> =
  T extends string
    ? true
    : false;
```

Теперь:

```ts id="0s28mg"
type Result =
  IsString<string | number>;
```

TypeScript делает:

```text id="no4jzt"
string extends string
? true
: false

|

number extends string
? true
: false
```

и получает:

```ts id="nl8n8o"
true | false
```

То есть conditional не спрашивает:

> весь `string | number` является `string`?

Он распределяется по members.

---

## Именно поэтому conditional types умеют фильтровать unions

Очень полезный example:

```ts id="v2uj5h"
type OnlyStrings<T> =
  T extends string
    ? T
    : never;
```

Передаём:

```ts id="rlpotn"
type Values =
  | string
  | number
  | boolean;
```

Получаем:

```ts id="r57s9d"
type Result =
  OnlyStrings<Values>;
// string
```

Что произошло:

```text id="58nwzs"
string
→ string

number
→ never

boolean
→ never
```

И затем:

```ts id="gn8p3t"
string | never | never
```

упрощается до:

```ts id="c3h8ro"
string
```

Вот где `never` начинает быть практически полезным как **type-level filter**.

---

## Стандартный `Exclude` построен на этой идее

Упрощённо:

```ts id="ys0cw0"
type MyExclude<T, U> =
  T extends U
    ? never
    : T;
```

Например:

```ts id="96h5qz"
type Status =
  | "pending"
  | "paid"
  | "failed";

type ActiveStatus =
  MyExclude<
    Status,
    "failed"
  >;
```

Distribution:

```text id="2i11zq"
"pending" extends "failed"
→ "pending"

"paid" extends "failed"
→ "paid"

"failed" extends "failed"
→ never
```

Результат:

```ts id="7spbqc"
"pending" | "paid"
```

То есть `Exclude` — это фактически conditional filter по union members. Стандартные `Exclude` и `Extract` входят в глобальные utility types TypeScript.

---

## `Extract` работает наоборот

```ts id="221sls"
type MyExtract<T, U> =
  T extends U
    ? T
    : never;
```

Например:

```ts id="8uhpdd"
type Event =
  | {
      type: "user.created";
      userId: string;
    }
  | {
      type: "user.deleted";
      userId: string;
    }
  | {
      type: "order.created";
      orderId: string;
    };
```

Можно получить только user events:

```ts id="gxsswr"
type UserEvent =
  Extract<
    Event,
    {
      userId: string;
    }
  >;
```

Результат — первые два members.

TypeScript проверяет каждый member отдельно:

```text id="spgd2h"
UserCreated
→ has userId
→ keep

UserDeleted
→ has userId
→ keep

OrderCreated
→ no userId
→ never
```

Это уже вполне реальный use case для больших event unions.

---

## Distribution может быть неожиданной

Представим:

```ts id="t7taxv"
type IsString<T> =
  T extends string
    ? true
    : false;
```

Ты хочешь спросить:

> является ли **весь тип** `T` подтипом `string`?

Пишешь:

```ts id="mzn0g8"
type Result =
  IsString<string | number>;
```

Но получаешь:

```ts id="0sgvcu"
true | false
```

потому что TypeScript задал вопрос отдельно каждому member.

Иногда это именно то, что нужно.

Иногда — нет.

---

## Distribution можно отключить

Для этого обе стороны `extends` оборачиваются в tuple:

```ts id="7tgpx5"
type IsString<T> =
  [T] extends [string]
    ? true
    : false;
```

Теперь:

```ts id="gm9a5j"
type A =
  IsString<string>;
// true

type B =
  IsString<string | number>;
// false
```

TypeScript больше не распределяет `T`.

Он проверяет union целиком:

```text id="c4gmw1"
[string | number]
extends
[string]
?
```

Ответ:

```text id="wexxbv"
false
```

Именно `[T] extends [U]` — стандартный способ отключить distributivity.

---

## Разница становится очень заметной с arrays

Distributive:

```ts id="xg4u08"
type ToArray<T> =
  T extends unknown
    ? T[]
    : never;
```

```ts id="3roqqc"
type Result =
  ToArray<string | number>;

// string[] | number[]
```

То есть допустим:

```ts id="hj11jq"
const a: Result =
  ["a", "b"];

const b: Result =
  [1, 2];
```

Но mixed array:

```ts id="u8sp6s"
const c: Result =
  ["a", 1];
// Error
```

Теперь non-distributive:

```ts id="q0qs6i"
type ToArray<T> =
  [T] extends [unknown]
    ? T[]
    : never;
```

Результат:

```ts id="dqc5vf"
(string | number)[]
```

и уже допустимо:

```ts id="wi949m"
["a", 1, "b", 2]
```

Это два совершенно разных contracts.

---

## Distribution позволяет transform каждый member union

Допустим:

```ts id="5g8rvr"
type Event =
  | "user.created"
  | "user.deleted"
  | "order.created";
```

Хотим превратить каждый event в handler:

```ts id="m2fi13"
type HandlerFor<T> =
  T extends string
    ? {
        type: T;
        handle:
          (event: T) => void;
      }
    : never;
```

Теперь:

```ts id="sn6xyd"
type Handlers =
  HandlerFor<Event>;
```

получаем union:

```ts id="b1dzwq"
{
  type: "user.created";
  handle:
    (event: "user.created") => void;
}
|
{
  type: "user.deleted";
  handle:
    (event: "user.deleted") => void;
}
|
{
  type: "order.created";
  handle:
    (event: "order.created") => void;
}
```

То есть distributive conditional type можно воспринимать как своеобразный:

```text id="c6fpnl"
map over union
```

Mapped type делает что-то похожее для keys object type.

Distributive conditional type — для members union.

---

## Можно распределять object unions

Например:

```ts id="47q4fb"
type ApiResult =
  | {
      type: "user";
      data: User;
    }
  | {
      type: "order";
      data: Order;
    };
```

Хотим получить только `data`:

```ts id="skk58k"
type DataOf<T> =
  T extends {
    data: infer D;
  }
    ? D
    : never;
```

Теперь:

```ts id="63bdlw"
type Data =
  DataOf<ApiResult>;
```

Distribution делает:

```text id="olbvf3"
user result
→ User

order result
→ Order
```

получаем:

```ts id="dk11ml"
User | Order
```

Здесь уже вместе работают:

* conditional types;
* distribution;
* `infer`;
* unions.

---

## Важный нюанс: alias может изменить поведение

Посмотрим:

```ts id="twrlkl"
type IsString<T> =
  T extends string
    ? true
    : false;
```

Это distributive.

Но если conditional применяется не непосредственно к type parameter, поведение может отличаться.

Например wrapping:

```ts id="4duglh"
type IsString<T> =
  [T] extends [string]
    ? true
    : false;
```

мы сознательно изменили semantic unit:

```text id="zmjh8t"
было:
каждый member T

стало:
T как единое значение type system
```

Это хороший mental model для понимания, а не просто trick с квадратными скобками.

---

## Не используй distribution, если обычный lookup понятнее

Допустим:

```ts id="30o7uq"
type EntityType =
  | "user"
  | "order";

type Entity<T> =
  T extends "user"
    ? User
    : T extends "order"
      ? Order
      : never;
```

Работает.

Но проще:

```ts id="junakp"
type EntityMap = {
  user: User;
  order: Order;
};

type Entity<
  T extends keyof EntityMap
> = EntityMap[T];
```

Если relationship является обычным mapping:

```text id="6pxa3m"
known key
→ known type
```

indexed access часто читается лучше conditional distribution.

Distributive conditional types особенно полезны именно когда нужно:

```text id="j6t9em"
filter union
transform each union member
extract something from each member
```

---

## Не бойся `never` в type-level code

Когда developer впервые видит:

```ts id="3zyop6"
T extends Something
  ? T
  : never
```

может казаться, что `never` означает error.

Нет.

Здесь он часто означает:

> этот member не должен присутствовать в результирующем union.

Например:

```ts id="jjms3g"
type WithId<T> =
  T extends {
    id: unknown;
  }
    ? T
    : never;
```

Для:

```ts id="wdvmze"
type Entity =
  User | Order | Date;
```

если `User` и `Order` имеют `id`, а `Date` нет:

```ts id="iwovrs"
type Identifiable =
  WithId<Entity>;
```

получим:

```ts id="vx1854"
User | Order
```

Это очень выразительный pattern.

---

## Вопросы на собеседовании

### Что такое distributive conditional type?

Это conditional type, который при получении union через generic type parameter применяется отдельно к каждому member этого union, а результаты затем объединяются обратно в union.

### Почему `ToArray<string | number>` даёт `string[] | number[]`?

Потому что conditional type распределяется:

```ts id="1h06vq"
ToArray<string>
|
ToArray<number>
```

а не обрабатывает `string | number` целиком.

### Как отключить distributivity?

Обернуть обе стороны `extends` в tuple:

```ts id="jf831x"
[T] extends [U]
```

Тогда TypeScript проверяет `T` целиком.

### Почему `never` часто используется в distributive conditional types?

Потому что `never` исчезает из union. Это позволяет фильтровать members: подходящий type возвращается, неподходящий превращается в `never`.

### Чем distributive conditional type похож на mapped type?

Mapped type преобразует набор keys, а distributive conditional type может преобразовывать members union. Оба позволяют выразить transformation над составным type.

### Когда distribution чаще всего реально полезна?

При фильтрации unions, extraction из каждого member и построении нового union на основе существующего.
