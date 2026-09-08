# 23. Multiple Type Parameters

Generic может иметь несколько type parameters:

```ts
function pair<T, U>(
  first: T,
  second: U
): [T, U] {
  return [first, second];
}
```

Использование:

```ts
const result = pair(
  "user",
  123
);
```

TypeScript выводит:

```ts
[string, number]
```

Здесь два type parameters нужны потому, что у нас **две независимые pieces of type information**:

```text
first  → T
second → U

result → [T, U]
```

Если бы использовать один `T`:

```ts
function pair<T>(
  first: T,
  second: T
): [T, T] {
  return [first, second];
}
```

мы бы описали другой contract:

> оба значения связаны одним type parameter.

То есть количество generic parameters — это не синтаксический выбор. Оно отражает **количество независимых type relationships**.

---

## Один `T` и два parameters не означают то же самое, что `T, U`

Сравним.

### Один type parameter

```ts
function combine<T>(
  a: T,
  b: T
): [T, T] {
  return [a, b];
}
```

Conceptually:

```text
a ─┐
   ├→ same T
b ─┘
```

### Два type parameters

```ts
function combine<T, U>(
  a: T,
  b: U
): [T, U] {
  return [a, b];
}
```

Теперь:

```text
a → T
b → U
```

и типы независимы.

Например:

```ts
combine("age", 30);
```

во втором случае естественно получает:

```ts
[string, number]
```

Главный вопрос:

> эти values должны иметь **один связанный тип** или каждый имеет собственную type identity?

---

## Несколько type parameters особенно полезны для relationships

Простой пример:

```ts
type ApiResponse<TData, TMeta> = {
  data: TData;
  meta: TMeta;
};
```

Теперь:

```ts
type UsersResponse = ApiResponse<
  User[],
  {
    page: number;
    total: number;
  }
>;
```

Здесь payload и metadata — независимые dimensions.

Если сделать:

```ts
ApiResponse<T>
```

пришлось бы либо фиксировать metadata, либо смешивать две разные concepts в один type parameter.

---

## Реальный пример: mapping

```ts
function mapValue<TInput, TOutput>(
  value: TInput,
  mapper: (value: TInput) => TOutput
): TOutput {
  return mapper(value);
}
```

Использование:

```ts
const length = mapValue(
  "hello",
  value => value.length
);
```

Inference:

```text
"hello"
↓
TInput = string

mapper result
↓
TOutput = number

function result
↓
number
```

Мы явно моделируем transformation:

```text
TInput → TOutput
```

Это одна из наиболее естественных причин использовать два generic parameters.

---

## Названия `T`, `U`, `K`, `V` не являются обязательными

Для маленьких generic functions:

```ts
function pair<T, U>(...)
```

нормально.

Но в сложном API:

```ts
type Transformer<
  TInput,
  TOutput
> = (
  input: TInput
) => TOutput;
```

часто читается лучше, чем:

```ts
type Transformer<T, U> =
  (input: T) => U;
```

То же для:

```ts
Repository<TEntity, TId>
ApiResponse<TData, TError>
Map<TKey, TValue>
```

Type parameters — часть API vocabulary.

Если generic parameters три-четыре и больше, single-letter names быстро превращают signature в математический ребус.

---

## Type parameters могут зависеть друг от друга

Самый важный example:

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

Здесь `T` и `K` **не независимы**.

Сначала есть:

```text
T
↓
keyof T
↓
allowed K
```

Например:

```ts
const user = {
  id: "u-1",
  name: "Alex",
  age: 30,
};
```

Для:

```ts
getProperty(user, "name");
```

TypeScript выводит:

```text
T =
{
  id: string;
  name: string;
  age: number;
}

K = "name"
```

А return:

```ts
T["name"]
→ string
```

Для:

```ts
getProperty(user, "age");
```

получаем:

```text
K = "age"

T[K]
→ number
```

Это очень важная лестница advanced TypeScript:

```text
multiple type parameters
        ↓
constraint between them
        ↓
keyof
        ↓
indexed access T[K]
```

---

## Почему `K` нужен отдельно

Можно написать:

```ts
function getProperty<T>(
  object: T,
  key: keyof T
) {
  return object[key];
}
```

Рассмотрим:

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

А:

```ts
User[keyof User]
```

может быть:

```ts
string | number
```

Поэтому вызов:

```ts
getProperty(user, "id");
```

может потерять конкретную связь с `"id"`.

С отдельным parameter:

```ts
K extends keyof T
```

мы сохраняем:

```text
K = "id"
↓
T[K] = string
```

Не просто:

```text
key is some keyof T
```

а:

> **это конкретный выбранный key из `T`.**

Вот зачем generic parameters иногда приходится разделять.

---

## Реальный backend example: entity + ID

Представим generic repository:

```ts
interface Repository<
  TEntity,
  TId
> {
  findById(
    id: TId
  ): Promise<TEntity | null>;

  save(
    entity: TEntity
  ): Promise<void>;
}
```

Теперь:

```ts
class UserRepository
  implements Repository<User, string> {
  // ...
}
```

А другая domain model:

```ts
class LegacyOrderRepository
  implements Repository<Order, number> {
  // ...
}
```

Если бы `id` всегда был:

```ts
string
```

второй generic parameter был бы лишним.

Но если identifier type действительно является variable dimension, `TId` отражает реальную relationship API.

---

## Не параметризуй то, что не меняется

Плохая abstraction:

```ts
interface Repository<
  TEntity,
  TId,
  TCreatedAt,
  TUpdatedAt,
  TConnection,
  TError
> {
  // ...
}
```

Технически flexible.

Практически caller должен понимать шесть generic dimensions.

Большое число type parameters увеличивает API complexity:

```text
more generic parameters
↓
more combinations
↓
harder inference
↓
harder error messages
↓
harder API to understand
```

Не каждая variation заслуживает type parameter.

Если `createdAt` в проекте всегда `Date`, просто используй `Date`.

Если error model всегда одна, не делай её generic без причины.

---

## Generic parameters должны участвовать в API

Плохой пример:

```ts
function process<T, U>(
  value: T
): T {
  return value;
}
```

`U` вообще нигде не используется.

Caller может написать:

```ts
process<User, Order>(user);
```

но `Order` ничего не меняет.

Это type parameter без relationship.

Каждый generic parameter должен отвечать на вопрос:

> **Какая часть API зависит от этого типа?**

Если ответа нет — parameter лишний.

---

## Не добавляй второй parameter, если тип можно получить из первого

Представим:

```ts
function getName<
  TUser,
  TName
>(
  user: TUser
): TName {
  // ...
}
```

Это подозрительно.

Если `TName` определяется самим `TUser`, caller не должен независимо выбирать его:

```ts
getName<User, number>(user);
```

API позволяет описать бессмысленную combination.

Лучше relationship должна быть вычислена:

```ts
function getName<
  T extends { name: unknown }
>(
  user: T
): T["name"] {
  return user.name;
}
```

Здесь caller контролирует только `T`.

Return type **следует из `T`**, а не задаётся отдельно.

Это важный design principle:

> не делай type parameter независимым, если на самом деле он должен быть derived from another type.

---

## Иногда explicit return generic опасен

Рассмотрим:

```ts
function parse<TInput, TOutput>(
  input: TInput
): TOutput {
  return JSON.parse(
    String(input)
  );
}
```

Caller может написать:

```ts
const user =
  parse<string, User>(json);
```

и TypeScript покажет:

```ts
User
```

Но runtime function вообще не доказала `User`.

`TOutput` контролируется caller-ом и превращается почти в красиво оформленный assertion.

Это хороший пример того, что:

> generic relationship должна отражаться в runtime implementation или быть честным compile-time contract.

Не нужно добавлять `TOutput` только ради того, чтобы caller мог выбрать желаемый return type.

---

## Type inference может идти сразу из нескольких positions

```ts
function mergePair<T, U>(
  left: T,
  right: U
) {
  return {
    left,
    right,
  };
}
```

Вызов:

```ts
const result = mergePair(
  { id: "u-1" },
  ["admin", "user"]
);
```

TypeScript независимо выводит:

```text
T → { id: string }

U → string[]
```

и строит:

```ts
{
  left: {
    id: string;
  };
  right: string[];
}
```

Обычно caller не должен вручную писать:

```ts
mergePair<User, string[]>(...)
```

пока inference справляется.

---

## Порядок type parameters тоже является частью DX

Представим:

```ts
function request<
  TResponse,
  TBody
>(
  body: TBody
): Promise<TResponse> {
  // ...
}
```

`TBody` может выводиться из argument.

`TResponse` вывести неоткуда.

Поэтому caller может писать:

```ts
request<UserResponse, CreateUserDto>(
  body
);
```

Иногда API можно спроектировать так, чтобы required explicit parameter был удобнее, а остальные inference выводил сам.

Type parameter design влияет не только на correctness, но и на ergonomics caller-а.

Если пользователю API постоянно приходится вручную писать четыре generic arguments, возможно, inference surface спроектирована плохо.

---

## Когда нужны несколько type parameters

Хорошие случаи:

```text
input → output
TInput → TOutput
```

```text
key → value
TKey → TValue
```

```text
entity → identifier
TEntity → TId
```

```text
object → one of its keys
T → K extends keyof T
```

Плохой мотив:

> сделаем всё generic на случай, если когда-нибудь понадобится.

Generic parameter — дополнительная степень свободы API.

Каждая степень свободы должна существовать по причине.

---

## Вопросы на собеседовании

### Зачем generic function несколько type parameters?

Когда API должен сохранить несколько независимых pieces of type information или выразить relationship между ними. Например `TInput → TOutput` или `T` вместе с `K extends keyof T`.

### Чем `function f<T>(a: T, b: T)` отличается от `function f<T, U>(a: T, b: U)`?

В первом варианте оба parameters связаны одним type parameter. Во втором их типы независимы и могут отдельно участвовать в return type или других constraints.

### Почему в `getProperty<T, K extends keyof T>` нужен отдельный `K`?

Чтобы сохранить конкретный выбранный key. Благодаря этому return type может быть `T[K]`, например `string` для `"name"`, а не union всех возможных property types.

### Всегда ли больше generic parameters означает более гибкий API?

Да, формально это добавляет flexibility, но одновременно увеличивает complexity. Если параметр не представляет реальную variable dimension API, его лучше не добавлять.

### Почему плохо иметь independent `TOutput`, если output на самом деле определяется `TInput`?

Потому что caller сможет выбрать несовместимую комбинацию типов. Если один type выводится из другого, relationship лучше выразить через type system, а не давать caller-у независимо задавать оба.

### Как понять, что generic parameter лишний?

Нужно посмотреть, участвует ли он в полезной relationship между parameters, return type или members. Если его удаление или замена на `unknown` ничего не меняет для caller-а, parameter, вероятно, не нужен.
