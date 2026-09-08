# 34. Structural Typing

TypeScript использует в основном **structural typing**.

Это означает:

> совместимость определяется структурой type, а не его именем или тем, был ли он явно объявлен как реализация другого type.

Например:

```ts
interface User {
  id: string;
  name: string;
}

const employee = {
  id: "u-1",
  name: "Alex",
  department: "Engineering",
};

const user: User = employee;
```

Это работает.

`employee` содержит всё, что требуется `User`:

```text
id: string
name: string
```

Дополнительный:

```text
department: string
```

не мешает assignment.

TypeScript сравнивает shape.

---

## Это отличается от nominal typing

В nominal type system отношения обычно основаны на explicit declaration:

```text
Dog implements Animal
Customer extends Person
```

TypeScript чаще задаёт другой вопрос:

> имеет ли value все required members нужных совместимых типов?

Например:

```ts
interface Logger {
  log(message: string): void;
}

class ConsoleLogger {
  log(message: string) {
    console.log(message);
  }
}
```

Даже без:

```ts
implements Logger
```

можно:

```ts
const logger: Logger =
  new ConsoleLogger();
```

Потому что structures совместимы.

---

## `implements` не создаёт compatibility

Рассмотрим:

```ts
interface Repository {
  save(user: User): Promise<void>;
}
```

Можно написать:

```ts
class PostgresRepository {
  async save(user: User) {
    // ...
  }
}
```

И передать:

```ts
function persist(
  repository: Repository
) {
  // ...
}

persist(
  new PostgresRepository()
);
```

Это уже structural compatibility.

`implements Repository`:

```ts
class PostgresRepository
  implements Repository {
  // ...
}
```

полезен потому, что проверяет class declaration относительно contract раньше.

Но structural compatibility не зависит от самого keyword `implements`.

---

## Function parameters тоже структурны

```ts
type UserSummary = {
  id: string;
  name: string;
};

function printUser(
  user: UserSummary
) {
  console.log(
    user.id,
    user.name
  );
}
```

Можно передать:

```ts
const fullUser = {
  id: "u-1",
  name: "Alex",
  email: "alex@example.com",
  active: true,
};

printUser(fullUser);
```

Функции не важно, что object содержит ещё.

Она требует только minimum shape.

Это делает TypeScript API довольно flexible:

```text
caller may know more
↓
callee requires less
↓
compatible
```

---

## Structural typing хорошо сочетается с dependency inversion

Например service требует:

```ts
interface Cache {
  get(key: string):
    Promise<string | null>;

  set(
    key: string,
    value: string
  ): Promise<void>;
}
```

В production:

```ts
const redisCache = {
  async get(key: string) {
    // Redis
  },

  async set(
    key: string,
    value: string
  ) {
    // Redis
  },

  async disconnect() {
    // extra method
  },
};
```

Он совместим с `Cache`, хотя содержит дополнительный `disconnect`.

В test можно передать:

```ts
const fakeCache = {
  async get() {
    return null;
  },

  async set() {},
};
```

И он тоже совместим.

Structural typing позволяет dependency contract оставаться минимальным.

---

## Но одинаковый shape может означать разные domain concepts

Вот важный недостаток.

```ts
type UserId = string;
type OrderId = string;
```

Для TypeScript:

```ts
const userId: UserId =
  "123";

const orderId: OrderId =
  userId;
```

нормально.

Оба type структурно являются:

```ts
string
```

Даже objects могут случайно совпасть:

```ts
type UserPosition = {
  x: number;
  y: number;
};

type MapPosition = {
  x: number;
  y: number;
};
```

Они совместимы, хотя domain meaning может различаться.

Structural typing оптимизирован под JavaScript interoperability, но иногда он допускает **semantic compatibility, которой бизнес-модель не хотела**.

---

## Branded types позволяют добавить nominal-like distinction

Например:

```ts
type UserId =
  string & {
    readonly __brand: "UserId";
  };

type OrderId =
  string & {
    readonly __brand: "OrderId";
  };
```

Теперь:

```ts
declare const userId: UserId;
declare const orderId: OrderId;

const id: UserId =
  orderId;
// Error
```

Это уже workaround поверх structural type system.

Но branded types не нужно применять ко всему подряд.

Они особенно полезны, когда случайное смешивание structurally identical values реально опасно:

* IDs;
* currencies;
* normalized/raw strings;
* validated values;
* units.

---

## Classes имеют важное исключение: private/protected members

В простом случае classes тоже structurally compatible:

```ts
class A {
  value = 1;
}

class B {
  value = 1;
}

let a: A =
  new B();
```

Но private/protected members меняют compatibility.

Если type содержит private member, другой compatible class должен иметь private member, происходящий из той же class hierarchy.

Например conceptually:

```ts
class User {
  private token = "";
}

class Order {
  private token = "";
}
```

Даже несмотря на похожий shape, private identity мешает простой structural compatibility.

Это один из немногих случаев, где class types становятся ближе к nominal behavior.

---

## Generics тоже структурны

Сравним:

```ts
interface Box<T> {}
```

Тогда:

```ts
let a: Box<string>;
let b: Box<number>;

a = b;
```

может оказаться допустимым, потому что `T` вообще не участвует в resulting structure.

Но:

```ts
interface Box<T> {
  value: T;
}
```

теперь:

```ts
Box<string>
```

и:

```ts
Box<number>
```

имеют разные structures:

```text
value: string
vs
value: number
```

и уже несовместимы. Это прямо следует из structural compatibility модели TypeScript.

---

## Structural typing не означает «все лишние properties всегда разрешены»

Вот здесь появляется частая путаница.

Это работает:

```ts
const employee = {
  id: "u-1",
  name: "Alex",
  department: "Engineering",
};

const user: User =
  employee;
```

Но:

```ts
const user: User = {
  id: "u-1",
  name: "Alex",
  department: "Engineering",
};
```

может дать ошибку из-за **excess property checking**.

Это не противоречие structural typing.

TypeScript просто применяет дополнительную safety-проверку к fresh object literals.

Следующий урок как раз об этом.

---

## Вопросы на собеседовании

### Что такое structural typing?

Это модель type compatibility, в которой важна структура типа — его members и их types — а не explicit inheritance или имя type.

### Нужно ли class явно `implements Interface`, чтобы быть совместимым?

Нет. Если instance structurally compatible с interface, его можно использовать. `implements` просто заставляет compiler проверить contract непосредственно в declaration class.

### Какой недостаток structural typing?

Разные domain concepts с одинаковой структурой могут оказаться совместимыми. Например `UserId` и `OrderId`, если оба являются alias для `string`.

### TypeScript полностью structural?

В основном да, но есть нюансы. Например private/protected class members влияют на compatibility и создают nominal-like ограничения.

---
