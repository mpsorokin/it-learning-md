# 20. Type Guards

Type guard — это runtime-проверка, после которой TypeScript может работать с **более узким типом**.

Ты уже использовал встроенные guards:

```ts
typeof value === "string"
```

```ts
"email" in user
```

```ts
error instanceof Error
```

Но TypeScript позволяет писать и собственные функции, которые сообщают compiler-у:

> если эта проверка вернула `true`, значение имеет конкретный тип.

---

## User-defined type predicate

Базовый syntax:

```ts
function isString(
  value: unknown
): value is string {
  return typeof value === "string";
}
```

Главное здесь:

```ts
value is string
```

Это **type predicate**.

Использование:

```ts
function print(value: unknown) {
  if (isString(value)) {
    value.toUpperCase();
  }
}
```

Без predicate обычный:

```ts
boolean
```

не всегда выражает relationship между argument и результатом так явно.

---

## Реальный пример: проверка external data

```ts
type User = {
  id: string;
  name: string;
};
```

Можно написать:

```ts
function isUser(
  value: unknown
): value is User {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
}
```

Теперь:

```ts
const payload: unknown =
  await loadPayload();

if (!isUser(payload)) {
  throw new Error("Invalid user");
}

payload.name;
// User
```

Guard становится boundary между:

```text
unknown
↓
runtime validation
↓
User
```

---

## Type predicate — это promise compiler-у

Вот где начинается важный senior nuance.

Можно написать неправильный guard:

```ts
function isUser(
  value: unknown
): value is User {
  return true;
}
```

TypeScript поверит.

```ts
const value: unknown = 123;

if (isUser(value)) {
  value.name.toUpperCase();
}
```

Compiler считает код безопасным.

Runtime — нет.

Поэтому type guard:

> **не доказывается TypeScript автоматически полностью.**

Predicate является контрактом, который реализует developer.

Это похоже на маленькую controlled assertion boundary.

Если guard неправильный, type safety после него тоже неправильная.

---

## Guard должен проверять ровно те guarantees, которые обещает

Плохо:

```ts
function isUser(
  value: unknown
): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value
  );
}
```

Если `User` требует:

```ts
{
  id: string;
  name: string;
}
```

этой проверки недостаточно.

Например:

```ts
{
  id: 123
}
```

пройдёт `"id" in value`, но не является `User`.

Нужны реальные проверки:

```ts
return (
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "name" in value &&
  typeof value.name === "string"
);
```

Иначе predicate обещает больше, чем runtime implementation подтверждает.

---

## Guards особенно полезны с arrays

Например:

```ts
const values: Array<User | null> = [
  user1,
  null,
  user2,
];
```

Можно иметь guard:

```ts
function isUser(
  value: User | null
): value is User {
  return value !== null;
}
```

Тогда:

```ts
const users = values.filter(isUser);
```

результат:

```ts
User[]
```

Это удобный pattern:

```text
(T | null)[]
↓ filter(type guard)
T[]
```

Современный TypeScript умеет сам выводить type predicates для ряда простых функций, но явный guard всё ещё полезен для сложной validation logic и reusable checks.

---

## Generic guard: `isNonNullable`

Очень полезный helper:

```ts
function isNonNullable<T>(
  value: T
): value is NonNullable<T> {
  return value !== null &&
         value !== undefined;
}
```

Использование:

```ts
const values:
  Array<User | null | undefined> =
  loadUsers();

const users =
  values.filter(isNonNullable);
```

Получаем:

```ts
User[]
```

Это лучше, чем писать unsafe assertion:

```ts
values.filter(Boolean) as User[]
```

если тебе нужна гарантированная и понятная type relationship.

---

## Assertion functions — близкий, но другой механизм

Иногда function не возвращает `boolean`, а throws при invalid value.

```ts
function assertUser(
  value: unknown
): asserts value is User {
  if (!isUser(value)) {
    throw new Error("Invalid user");
  }
}
```

Использование:

```ts
const payload: unknown =
  await loadPayload();

assertUser(payload);

payload.name;
// User
```

Разница:

```text
type guard
→ returns boolean
→ caller выбирает branch

assertion function
→ throws if invalid
→ после вызова type считается narrowed
```

Это очень удобно для validation boundaries.

---

## Guard vs assertion `as`

Можно сделать:

```ts
const user =
  payload as User;
```

Это ничего не проверяет.

Можно:

```ts
if (isUser(payload)) {
  // User
}
```

Теперь type change основан на runtime condition.

Conceptually:

```text
as User
→ trust me

isUser(...)
→ check, then trust
```

Но качество второго варианта напрямую зависит от correctness guard-а.

---

## Не пиши огромные manual guards для больших schemas

Для:

```ts
type CreateOrderRequest = {
  customer: {
    id: string;
    address: {
      ...
    };
  };
  items: ...
}
```

ручная функция:

```ts
isCreateOrderRequest()
```

может превратиться в десятки строк fragile validation.

В production boundary часто лучше использовать schema validator.

Архитектурно:

```text
external data
↓
schema validation
↓
typed result
↓
application/domain
```

User-defined type guards хороши для:

* небольших shapes;
* reusable predicates;
* domain checks;
* narrowing уже частично typed values.

Но они не обязаны заменять полноценную validation library.

---

## Type guard может выражать domain condition

Guard не обязательно проверяет только primitive structure.

Например:

```ts
type User =
  | GuestUser
  | RegisteredUser;

function isRegistered(
  user: User
): user is RegisteredUser {
  return user.type === "registered";
}
```

Тогда:

```ts
if (isRegistered(user)) {
  user.accountId;
}
```

Это может повысить readability, если одно и то же narrowing используется во многих местах.

Но если check прост:

```ts
user.type === "registered"
```

создавать отдельную функцию только ради abstraction не всегда нужно.

---

## Не скрывай слишком много logic за guard name

Плохо:

```ts
if (isValidUser(user)) {
  ...
}
```

если внутри `isValidUser()` неожиданно:

* идёт database query;
* проверяются permissions;
* мутируется state;
* логируется audit event.

Type guard лучше оставлять **pure predicate**, который отвечает на понятный вопрос о значении.

Это делает и runtime semantics, и type reasoning предсказуемыми.

---

## Type guards — это boundary между runtime и compile time

Это самая важная идея темы.

TypeScript сам работает compile time.

Но runtime data существует вне type system.

Guard связывает эти два мира:

```text
runtime evidence
      ↓
type predicate
      ↓
compile-time narrowing
```

Поэтому хороший type guard — не просто helper function.

Это место, где developer говорит:

> вот конкретное runtime evidence, достаточное для того, чтобы считать значение этим типом.

---

## Вопросы на собеседовании

### Что такое type guard?

Это runtime-проверка, которую TypeScript использует для narrowing значения до более конкретного типа в определённой control-flow branch.

### Что такое type predicate?

Это return type вида:

```ts
value is User
```

Он сообщает TypeScript, что если функция вернула `true`, argument можно считать `User`.

### Может ли TypeScript проверить, что custom type guard написан правильно?

Не полностью. Developer может написать predicate, который обещает `User`, но выполняет недостаточную runtime-проверку. Поэтому correctness guard-а является частью responsibility разработчика.

### Чем type guard отличается от `as`?

`as` не выполняет runtime validation — это assertion. Type guard связывает реальную runtime-проверку с compile-time narrowing.

### Что такое assertion function?

Это function с return type вида:

```ts
asserts value is User
```

Она либо завершает проверку успешно и сужает тип после вызова, либо throws.

### Когда лучше использовать schema validation вместо custom type guard?

Когда external payload большой, вложенный или критичный. Ручные guards быстро становятся сложными и могут расходиться с type definition.
