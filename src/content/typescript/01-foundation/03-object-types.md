# Object Types

Object type описывает **структуру объекта**, которую TypeScript ожидает увидеть.

```ts
type User = {
  id: string;
  name: string;
  active: boolean;
};
```

После этого любой `User` должен иметь совместимую структуру:

```ts
const user: User = {
  id: "u-123",
  name: "Alex",
  active: true,
};
```

Ключевой момент: TypeScript интересует в первую очередь **shape объекта**, а не то, откуда этот объект появился.

---

## Object type — это контракт на свойства

Функция может требовать только необходимые ей свойства:

```ts
function sendEmail(user: {
  email: string;
  active: boolean;
}) {
  if (!user.active) return;

  // send email
}
```

Ей не важно, является ли объект полноценным `User`, `Customer` или чем-то ещё.

Главное — чтобы в нём были совместимые:

```ts
email: string
active: boolean
```

Например:

```ts
const customer = {
  id: 10,
  email: "alex@example.com",
  active: true,
  plan: "pro",
};

sendEmail(customer);
```

Это работает, потому что нужная структура присутствует.

Именно из этой идеи дальше вырастает structural typing, но его лучше разбирать отдельной темой.

---

## Optional properties

Свойство можно сделать необязательным:

```ts
type CreateUserInput = {
  email: string;
  displayName?: string;
};
```

Теперь оба объекта допустимы:

```ts
const a: CreateUserInput = {
  email: "a@example.com",
};

const b: CreateUserInput = {
  email: "b@example.com",
  displayName: "Alex",
};
```

Но при чтении optional property нужно учитывать отсутствие значения:

```ts
function greet(user: CreateUserInput) {
  return user.displayName.toUpperCase();
}
```

TypeScript справедливо возразит: `displayName` может отсутствовать.

Нужно обработать этот случай:

```ts
function greet(user: CreateUserInput) {
  const name = user.displayName ?? user.email;

  return name.toUpperCase();
}
```

### `foo?: string` и `foo: string | undefined` — не совсем одно и то же

Сравним:

```ts
type A = {
  name?: string;
};

type B = {
  name: string | undefined;
};
```

Для `A` property может отсутствовать полностью:

```ts
const a: A = {};
```

Для `B` property обязана существовать:

```ts
const b: B = {
  name: undefined,
};
```

Разница небольшая, но в API design бывает важна:

```text
optional property
→ поле может отсутствовать

T | undefined
→ поле существует, но его значение может быть undefined
```

---

## Nested object types

Объекты естественно вкладываются друг в друга:

```ts
type Order = {
  id: string;
  customer: {
    id: string;
    email: string;
  };
  total: number;
};
```

Для одноразового небольшого объекта это нормально.

Если вложенная структура используется отдельно или имеет собственное domain meaning, лучше дать ей имя:

```ts
type Customer = {
  id: string;
  email: string;
};

type Order = {
  id: string;
  customer: Customer;
  total: number;
};
```

Это не столько вопрос TypeScript, сколько maintainability.

Если объект является отдельной концепцией системы, отдельный тип обычно делает код понятнее.

---

## `readonly` не делает объект полностью immutable

```ts
type User = {
  readonly id: string;
  name: string;
};

const user: User = {
  id: "u-1",
  name: "Alex",
};

user.id = "u-2";
// Error

user.name = "Maria";
// OK
```

`readonly` запрещает присваивание конкретному property через этот type.

Но это shallow restriction.

```ts
type Order = {
  readonly customer: {
    name: string;
  };
};
```

Нельзя сделать:

```ts
order.customer = anotherCustomer;
```

Но можно:

```ts
order.customer.name = "Maria";
```

Потому что `readonly` стоит на `customer`, а не на `customer.name`.

И ещё важнее: `readonly` — механизм TypeScript compile-time checking. Он сам по себе не вызывает `Object.freeze()` и не делает JavaScript object immutable runtime.

---

## Object types не валидируют runtime data

Это одна из самых важных практических границ TypeScript.

Допустим:

```ts
type ApiUser = {
  id: string;
  name: string;
};
```

И мы получили данные по HTTP.

TypeScript тип существует только во время проверки программы. Он не проверит JSON от сервера.

Такой код:

```ts
const user = responseData as ApiUser;
```

не валидирует:

```json
{
  "id": null,
  "username": 123
}
```

Мы просто убедили compiler, что данные корректны.

Поэтому на внешних boundaries:

* HTTP;
* message queues;
* files;
* environment variables;
* user input;

может потребоваться runtime validation.

```text
TypeScript type
→ описывает ожидаемую структуру

runtime validator
→ проверяет реальную структуру
```

Это две разные задачи.

---

## Object type должен отражать смысл API

Плохой тип:

```ts
type User = {
  id?: string;
  name?: string;
  email?: string;
  passwordHash?: string;
  createdAt?: Date;
};
```

Если почти всё optional просто потому, что «так удобнее», TypeScript перестаёт хорошо моделировать состояние.

Например иногда правильнее иметь отдельные контракты:

```ts
type CreateUserInput = {
  email: string;
  name: string;
};

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};
```

Типы должны отражать реальные гарантии системы, а не быть максимально permissive.

## Interview questions

### Что описывает object type в TypeScript?

Структуру значения: какие properties существуют, какие у них типы и какие из них optional или readonly. TypeScript в основном проверяет структурную совместимость, а не nominal identity объекта.

### В чём разница между optional property и `string | undefined`?

Optional property может вообще отсутствовать. Property типа `string | undefined` обязана присутствовать, но её значением может быть `undefined`.

### Делает ли `readonly` объект immutable?

Нет. `readonly` запрещает определённые присваивания на уровне type checker и по умолчанию действует только на конкретный property. Он не обеспечивает deep immutability и не замораживает объект runtime.

### Валидирует ли TypeScript JSON от API?

Нет. Types удаляются при компиляции и не существуют runtime. Внешние данные необходимо валидировать отдельно, если их структуре нельзя доверять.
