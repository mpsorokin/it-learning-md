# 22. Generic Constraints

Обычный generic `T` означает:

> здесь может быть практически любой тип.

Поэтому TypeScript не позволяет делать предположения о его structure.

```ts
function getLength<T>(value: T) {
  return value.length;
}
```

Ошибка:

```text
Property 'length' does not exist on type 'T'
```

И TypeScript прав.

Caller может передать:

```ts
getLength(123);
```

У `number` нет `length`.

Если generic должен работать не со всеми возможными типами, а только с типами определённой формы, используется **constraint**:

```ts
function getLength<
  T extends { length: number }
>(value: T): number {
  return value.length;
}
```

Теперь допустимы:

```ts
getLength("hello");
getLength([1, 2, 3]);
getLength({ length: 10 });
```

Но:

```ts
getLength(123);
// Error
```

`extends` здесь означает не class inheritance, а:

> `T` должен быть assignable to этот constraint.

Generic constraints именно так ограничивают множество допустимых type arguments, сохраняя при этом конкретный тип caller-а.

---

## Constraint не заменяет `T`

Это очень важная идея.

Сравним:

```ts
function firstWithId(
  value: { id: string }
): { id: string } {
  return value;
}
```

Передаём:

```ts
const user = firstWithId({
  id: "u-1",
  name: "Alex",
  email: "alex@example.com",
});
```

Return type:

```ts
{ id: string }
```

Мы потеряли:

```text
name
email
```

Теперь generic constraint:

```ts
function firstWithId<
  T extends { id: string }
>(value: T): T {
  return value;
}
```

Передаём тот же object:

```ts
const user = firstWithId({
  id: "u-1",
  name: "Alex",
  email: "alex@example.com",
});
```

Return type сохраняет полный shape:

```ts
{
  id: string;
  name: string;
  email: string;
}
```

Constraint говорит:

> мне гарантирован минимум `{ id: string }`.

Но `T` остаётся реальным конкретным типом.

Это fundamental difference:

```text
parameter: { id: string }
→ принимаем shape
→ наружу знаем только этот shape

T extends { id: string }
→ требуем minimum shape
→ сохраняем полный T
```

---

## Constraint определяет, что implementation имеет право делать

Без constraint:

```ts
function printId<T>(value: T) {
  console.log(value.id);
}
```

TypeScript не может гарантировать наличие `id`.

После:

```ts
function printId<
  T extends { id: string }
>(value: T) {
  console.log(value.id);
}
```

implementation получает гарантию:

```text
для любого допустимого T
id: string существует
```

Но она всё ещё не знает о произвольных properties:

```ts
function printId<
  T extends { id: string }
>(value: T) {
  value.email;
  // Error
}
```

Потому что не каждый `T extends { id: string }` обязан иметь `email`.

Constraint задаёт **минимальный контракт**, а не конкретный final type.

---

## Используй минимальный constraint

Представим:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}
```

Функции нужен только `id`:

```ts
function getCacheKey<
  T extends User
>(value: T) {
  return `entity:${value.id}`;
}
```

Это работает, но constraint слишком сильный.

Функция не использует:

```text
name
email
active
```

Лучше:

```ts
function getCacheKey<
  T extends { id: string }
>(value: T) {
  return `entity:${value.id}`;
}
```

Теперь API работает с любой entity, у которой есть string `id`.

Это хороший general design principle:

> **Constraint должен требовать минимальную capability, необходимую implementation.**

Не заставляй caller быть `User`, если функции нужен только `{ id: string }`.

---

## Structural typing делает constraints особенно гибкими

Constraint:

```ts
T extends { length: number }
```

не требует специального interface:

```ts
interface Lengthwise {
  length: number;
}
```

Любой structurally compatible type подходит:

```ts
"hello"
[1, 2, 3]
{ length: 100 }
new Uint8Array(10)
```

Именно поэтому TypeScript constraints хорошо выражают **capabilities**:

```ts
T extends { id: string }
T extends { length: number }
T extends { serialize(): string }
```

вместо жёсткой nominal hierarchy.

---

## Самый важный constraint pattern: `K extends keyof T`

Представим функцию:

```ts
function getProperty(
  object: object,
  key: string
) {
  return object[key];
}
```

Проблема:

```ts
getProperty(user, "banana");
```

TypeScript должен знать, что key действительно принадлежит конкретному object.

Используем два type parameters:

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
  active: true,
};

getProperty(user, "name");
// string

getProperty(user, "active");
// boolean

getProperty(user, "banana");
// Error
```

Relationship выглядит так:

```text
T
↓
keyof T
↓
K must be one of those keys
↓
return T[K]
```

Официальный Handbook использует именно этот pattern как основной пример constraint, где один type parameter ограничивается другим.

`keyof` и indexed access будут отдельными уроками, поэтому сейчас важна именно идея:

> constraint может описывать relationship между types, а не только требовать fixed shape.

---

## Почему просто `keyof T` parameter иногда достаточно

Можно написать:

```ts
function getProperty<T>(
  object: T,
  key: keyof T
) {
  return object[key];
}
```

Почему тогда нужен отдельный `K`?

Потому что отдельный `K` сохраняет **конкретный key type**.

Рассмотрим:

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

Для:

```ts
getProperty(user, "name");
```

TypeScript знает:

```text
K = "name"
↓
T[K] = string
```

Если key просто широкий:

```ts
keyof T
```

result может стать union значений всех properties.

Generic parameter полезен именно потому, что сохраняет конкретный member relationship.

---

## Constraint не означает runtime validation

```ts
function save<
  T extends User
>(user: T) {
  // ...
}
```

не означает, что arbitrary JSON проверяется как `User`.

Если сделать:

```ts
const payload =
  JSON.parse(input) as User;

save(payload);
```

constraint видит уже заявленный compiler-у `User`.

Он ничего не проверяет runtime.

Generic constraint отвечает на вопрос:

> какие compile-time types разрешены caller-у?

а не:

> действительно ли runtime object соответствует этому contract?

---

## Слишком широкий constraint может ничего не дать

Иногда встречается:

```ts
function process<T extends object>(
  value: T
) {
}
```

Это запрещает primitives, но implementation всё ещё почти ничего не знает о `T`.

Нельзя:

```ts
value.id;
value.name;
```

Поэтому нужно спросить:

> зачем нам вообще `extends object`?

Иногда причина есть:

* API действительно принимает только objects;
* дальше используются object-specific type transformations;
* generic должен исключить primitives.

Но не нужно добавлять constraint просто потому, что generic «выглядит безопаснее».

Constraint должен выражать реальное требование.

---

## Constraint vs union

Представим:

```ts
function normalize<
  T extends string | number
>(value: T): T {
  return value;
}
```

Если задача просто принять:

```text
string OR number
```

и generic relationship дальше не используется, проще:

```ts
function normalize(
  value: string | number
) {
  // ...
}
```

Constraint нужен, когда важно одновременно:

1. ограничить допустимое множество типов;
2. сохранить конкретный `T`.

Например:

```ts
function echo<
  T extends string | number
>(value: T): T {
  return value;
}

const a = echo("hello");
// конкретный string-ish T

const b = echo(42);
// конкретный number-ish T
```

Если конкретность результата не нужна, union часто проще.

---

## Generic defaults и constraints могут работать вместе

Можно встретить:

```ts
type ApiResponse<
  T extends object = Record<string, never>
> = {
  data: T;
};
```

Здесь:

```text
extends object
→ constraint

= ...
→ default type argument
```

Это разные механизмы.

Constraint отвечает:

> какие `T` допустимы?

Default:

> какой `T` использовать, если caller ничего не указал?

Не стоит их путать.

---

## Constraint должен отражать capability, а не implementation accident

Допустим:

```ts
function serialize<
  T extends BaseEntity
>(value: T) {
  return JSON.stringify(value);
}
```

Но `JSON.stringify()` вообще не требует `BaseEntity`.

Constraint появился, потому что сегодня функция используется только для entities, а не потому что implementation реально требует эту capability.

Это делает utility искусственно ограниченной.

Вместо:

```ts
T extends BaseEntity
```

возможно, нужен:

```ts
function serialize<T>(value: T) {
  return JSON.stringify(value);
}
```

или вообще:

```ts
function serialize(value: unknown) {
  return JSON.stringify(value);
}
```

в зависимости от contract.

Senior-level вопрос:

> **Constraint выражает реальный invariant или просто текущее usage?**

---

## Вопросы на собеседовании

### Что такое generic constraint?

Constraint ограничивает множество допустимых type arguments. Например `T extends { id: string }` означает, что любой `T` должен как минимум иметь совместимое property `id: string`.

### Зачем использовать constraint вместо конкретного parameter type?

Потому что constraint позволяет потребовать минимальный shape, но сохранить весь конкретный тип caller-а. Обычный `{ id: string }` может потерять дополнительную type information.

### Что означает `extends` в generic constraint?

Это assignability constraint, а не обязательно class inheritance. `T extends X` означает, что `T` должен быть совместим с `X`.

### Почему constraint лучше делать минимальным?

Чтобы API требовал только capabilities, которые реально нужны implementation. Слишком сильный constraint без причины уменьшает reusability и связывает функцию с конкретной domain model.

### Что означает `K extends keyof T`?

`K` ограничен ключами объекта `T`. Это сохраняет relationship между конкретным object, выбранным property key и return type `T[K]`.

### Когда вместо generic constraint лучше использовать union?

Если нужно просто принять несколько фиксированных типов и сохранять конкретный subtype дальше не требуется. Generic имеет смысл, когда конкретный `T` участвует в relationship с другими parts API.
