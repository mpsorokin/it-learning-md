# 15. `in` Narrowing

Оператор `in` проверяет, существует ли property в объекте:

```ts
"property" in value
```

TypeScript может использовать эту runtime-проверку для narrowing object unions.

Например:

```ts
type User = {
  name: string;
};

type Admin = {
  name: string;
  permissions: string[];
};

function printAccount(
  account: User | Admin
) {
  if ("permissions" in account) {
    account.permissions;
    // Admin
  } else {
    account.name;
    // User
  }
}
```

`permissions` существует только в `Admin`, поэтому TypeScript может определить конкретный member union.

---

## `in` полезен, когда типы различаются по shape

Например response от двух разных источников:

```ts
type Success = {
  data: User;
};

type Failure = {
  error: Error;
};

function handle(
  result: Success | Failure
) {
  if ("error" in result) {
    console.error(result.error);
    return;
  }

  console.log(result.data.name);
}
```

Это вполне рабочая модель.

Но если ты сам проектируешь API, часто ещё лучше explicit discriminant:

```ts
type Result =
  | {
      status: "success";
      data: User;
    }
  | {
      status: "error";
      error: Error;
    };
```

Тогда narrowing:

```ts
if (result.status === "error") {
  // ...
}
```

обычно читается яснее.

`in` особенно полезен, когда structure уже существует и ты не контролируешь её дизайн.

---

## Важный нюанс: optional properties могут существовать в обеих ветках

Рассмотрим:

```ts
type Human = {
  name: string;
  swim?: () => void;
};

type Fish = {
  swim: () => void;
};

type Bird = {
  fly: () => void;
};
```

Теперь:

```ts
function move(
  animal: Human | Fish | Bird
) {
  if ("swim" in animal) {
    animal;
  } else {
    animal;
  }
}
```

Можно интуитивно ожидать:

```text
true → Fish
false → Human | Bird
```

Но `Human` имеет optional `swim`.

Он может попасть в ветку `true`, если property существует, и в ветку `false`, если её нет.

Conceptually:

```text
"swim" in animal

true:
Human | Fish

false:
Human | Bird
```

Это важный nuance:

> `in` проверяет существование property runtime, а не просто смотрит на список типов в declaration.

Optional property может присутствовать или отсутствовать.

---

## `in` не проверяет тип значения property

Допустим:

```ts
function hasName(
  value: object
) {
  if ("name" in value) {
    // property существует
  }
}
```

Это ещё не означает:

```ts
value.name: string
```

Property может оказаться:

```ts
name: number
name: null
name: object
```

Если вход — `unknown`, нормальная проверка выглядит глубже:

```ts
function hasStringName(
  value: unknown
): value is { name: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string"
  );
}
```

Здесь мы последовательно доказываем:

```text
value is object
↓
not null
↓
has property "name"
↓
name is string
```

Это намного ближе к реальной runtime validation.

---

## Перед `in` нужно убедиться, что справа object

Нельзя безопасно сделать:

```ts
function handle(value: unknown) {
  if ("name" in value) {
    // ...
  }
}
```

Потому что `in` ожидает object-like right-hand side.

Нужно:

```ts
function handle(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "name" in value
  ) {
    // ...
  }
}
```

То есть `in` часто используется не отдельно, а после более базового object guard.

---

## `in` учитывает prototype chain

JavaScript expression:

```ts
"toString" in object
```

проверяет не только own properties, но и prototype chain.

Например:

```ts
const user = {};

"toString" in user;
// true
```

потому что property доступен через `Object.prototype`.

Это важно понимать:

> `in` не является эквивалентом `Object.hasOwn()`.

Если бизнес-логике важно именно наличие собственного property, runtime semantics должны быть другими.

Для TypeScript narrowing `in` удобен как structural guard, но не стоит автоматически трактовать его как строгую validation own-properties.

---

## `in` хорошо подходит для legacy/external unions

Допустим, два API возвращают разные shapes:

```ts
type LegacyUser = {
  user_name: string;
};

type ModernUser = {
  name: string;
};

function getName(
  user: LegacyUser | ModernUser
) {
  if ("user_name" in user) {
    return user.user_name;
  }

  return user.name;
}
```

Если изменить API невозможно, `in` — простой и понятный guard.

Но если ты проектируешь новый domain model:

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

явный `type` обычно лучше, чем:

```ts
if ("cardNumber" in payment)
```

потому что discriminant прямо выражает domain meaning.

---

## Не используй случайное property как хрупкий discriminant

Например:

```ts
if ("metadata" in event) {
  // считаем, что это SomeSpecialEvent
}
```

Сегодня это может работать.

Но завтра `metadata` добавят ещё одному event type, и narrowing перестанет выражать реальную модель.

Лучше discriminant, который является частью контракта:

```ts
event.type === "user.created"
```

То есть:

```text
in
→ отлично для structural difference

explicit discriminant
→ лучше для намеренно спроектированных domain variants
```

---

## Вопросы на собеседовании

### Как `in` используется для narrowing?

Если property присутствует только у части union members, TypeScript может использовать `"property" in value` для narrowing к тем типам, где такое property возможно.

### Что происходит с optional property?

Тип с optional property может остаться и в true-, и в false-ветке, потому что property runtime может существовать или отсутствовать.

### Проверяет ли `in`, что property имеет нужный тип?

Нет. `in` проверяет существование property. Если нужно доказать `name: string`, нужно отдельно проверить тип `value.name`.

### Чем `in` отличается от `Object.hasOwn()`?

`in` учитывает prototype chain. `Object.hasOwn()` проверяет только own property объекта.

### Когда лучше discriminated union, а не `in`?

Когда ты контролируешь дизайн domain model. Явное поле вроде `type` или `status` обычно стабильнее и понятнее, чем вывод варианта по случайному набору properties.
