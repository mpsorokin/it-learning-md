# 16. `instanceof` Narrowing

`instanceof` проверяет runtime prototype relationship:

```ts
value instanceof SomeClass
```

TypeScript использует эту проверку для narrowing.

Простой пример:

```ts
function getMessage(
  error: Error | string
) {
  if (error instanceof Error) {
    return error.message;
  }

  return error;
}
```

В первой ветке:

```text
error: Error
```

во второй:

```text
error: string
```

---

## `instanceof` работает потому, что class существует runtime

В отличие от `interface`:

```ts
interface User {
  id: string;
}
```

class создаёт реальный JavaScript constructor:

```ts
class ValidationError extends Error {
  constructor(
    message: string,
    readonly field: string
  ) {
    super(message);
  }
}
```

Поэтому можно написать:

```ts
if (error instanceof ValidationError) {
  console.log(error.field);
}
```

А такое невозможно:

```ts
if (value instanceof User) {
}
```

если `User` — interface.

`interface` удаляется при compilation.

`class` остаётся runtime value.

---

## Самый частый реальный use case — error handling

Например:

```ts
class NotFoundError extends Error {
  constructor(
    readonly resource: string
  ) {
    super(`${resource} not found`);
  }
}

class ValidationError extends Error {
  constructor(
    readonly issues: string[]
  ) {
    super("Validation failed");
  }
}
```

Теперь:

```ts
function mapError(error: unknown) {
  if (error instanceof NotFoundError) {
    return {
      status: 404,
      message: error.message,
    };
  }

  if (error instanceof ValidationError) {
    return {
      status: 400,
      issues: error.issues,
    };
  }

  return {
    status: 500,
    message: "Internal error",
  };
}
```

Это гораздо сильнее, чем:

```ts
if ((error as any).name === "ValidationError")
```

потому что `instanceof` одновременно:

* выполняет runtime check;
* даёт TypeScript narrowing;
* опирается на реальную class relationship.

---

## `instanceof` проверяет prototype chain, а не shape

Рассмотрим:

```ts
class User {
  constructor(
    public id: string
  ) {}
}
```

И object той же структуры:

```ts
const value = {
  id: "u-123",
};
```

Structurally он может быть совместим с некоторыми usages `User`.

Но:

```ts
value instanceof User;
// false
```

Почему?

Потому что object был создан не через `User` prototype chain.

То есть:

```text
TypeScript structural compatibility
≠
JavaScript instanceof
```

Это очень важное различие.

`instanceof` отвечает не на вопрос:

> выглядит ли object как `User`?

а:

> находится ли `User.prototype` в prototype chain этого object?

---

## Поэтому `instanceof` обычно плохо подходит для JSON

Допустим API возвращает:

```json
{
  "id": "u-123",
  "name": "Alex"
}
```

Даже если у нас есть:

```ts
class User {
  constructor(
    public id: string,
    public name: string
  ) {}
}
```

после `JSON.parse()`:

```ts
const user = JSON.parse(json);

user instanceof User;
// false
```

JSON создаёт plain object, а не instance class.

Для API data обычно нужны:

* structural validation;
* schema validation;
* explicit transformation в class instance, если она действительно нужна.

Это частая ошибка:

> class type существует → значит JSON автоматически становится instance class.

Нет.

---

## `instanceof Error` — полезно, но тоже имеет границы

Обычный catch:

```ts
try {
  await execute();
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  }
}
```

Это хороший pattern.

Но JavaScript позволяет throw:

```ts
throw "failed";
throw 123;
throw { message: "failed" };
```

Поэтому fallback всё равно нужен:

```ts
try {
  await execute();
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error("Unknown error", error);
  }
}
```

---

## `instanceof` может ломаться между realms

Это уже более senior nuance.

JavaScript objects могут приходить из другого runtime realm, например:

* iframe;
* отдельного browser window;
* некоторых VM contexts.

У каждого realm может быть собственный constructor.

Объект может концептуально быть `Array`, но:

```ts
value instanceof Array
```

вести себя неожиданно, если `Array` constructor принадлежит другому realm.

Именно поэтому для массивов обычно предпочитают:

```ts
Array.isArray(value)
```

а не:

```ts
value instanceof Array
```

В обычном Node/Nest backend это редко становится проблемой, но важно понимать саму semantics `instanceof`.

---

## Custom `Symbol.hasInstance`

`instanceof` в JavaScript технически может быть кастомизирован через:

```ts
Symbol.hasInstance
```

Например class может переопределить логику:

```ts
class Numeric {
  static [Symbol.hasInstance](value: unknown) {
    return typeof value === "number";
  }
}
```

Тогда:

```ts
123 instanceof Numeric;
```

может вернуть `true`.

Это показывает важный conceptual point:

> `instanceof` — это JavaScript runtime operation, а TypeScript только использует её результат для narrowing.

Не нужно использовать custom `Symbol.hasInstance` в обычном business code без серьёзной причины, но для senior-level понимания полезно знать, что narrowing опирается на JS semantics.

---

## `instanceof` vs discriminated union

Если у тебя действительно class hierarchy:

```ts
class CardPayment {}
class BankPayment {}
```

то:

```ts
payment instanceof CardPayment
```

может быть естественным.

Но для plain domain data:

```ts
type Payment =
  | {
      type: "card";
      cardNumber: string;
    }
  | {
      type: "bank";
      iban: string;
    };
```

обычно лучше:

```ts
payment.type === "card"
```

Здесь нет необходимости вводить runtime classes только ради narrowing.

Практическое правило:

```text
real class instances
→ instanceof

plain data / DTO / API state
→ discriminated union
```

---

## Когда `instanceof` особенно уместен

Хорошие случаи:

* custom `Error` classes;
* built-in types вроде `Date`;
* class-based domain model;
* framework objects, которые реально являются instances.

Например:

```ts
function serializeDate(
  value: string | Date
) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}
```

Здесь `instanceof Date` естественен и точен.

---

## Вопросы на собеседовании

### Как `instanceof` narrowing работает в TypeScript?

TypeScript использует runtime-result оператора `instanceof` и сужает значение до соответствующего class/constructor type в этой control-flow branch.

### Почему нельзя написать `value instanceof SomeInterface`?

Потому что interface существует только в TypeScript type system и удаляется при compilation. `instanceof` требует runtime value с prototype.

### Почему JSON object не проходит `instanceof User`?

Потому что совпадение properties не имеет значения для `instanceof`. Проверяется prototype chain, а объект из JSON является plain object и не наследует `User.prototype`.

### В чём отличие `instanceof` от structural typing?

Structural typing проверяет совместимость формы на compile time. `instanceof` проверяет runtime prototype relationship. Объект может иметь совместимую структуру и при этом не быть instance соответствующего class.

### Когда лучше использовать discriminated union вместо `instanceof`?

Когда модель состоит из plain data, DTO или API states и class identity не является частью domain model. Для таких случаев явный discriminant обычно проще, стабильнее и не требует runtime classes.
