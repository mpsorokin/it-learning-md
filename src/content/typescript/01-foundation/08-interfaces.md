# 8. Interfaces

`interface` описывает **контракт object shape**.

```ts
interface User {
  id: string;
  name: string;
  active: boolean;
}
```

Теперь значение совместимо с `User`, если предоставляет требуемую структуру:

```ts
const user: User = {
  id: "u-123",
  name: "Alex",
  active: true,
};
```

`interface` не создаёт JavaScript class и вообще не существует runtime. Это исключительно описание типа.

Главная идея:

```text
interface
→ named object contract
```

---

## Interface хорошо подходит для публичных object contracts

Например repository:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

Implementation может быть любой:

```ts
class PostgresUserRepository implements UserRepository {
  async findById(id: string) {
    // PostgreSQL
  }

  async save(user: User) {
    // PostgreSQL
  }
}
```

или:

```ts
class InMemoryUserRepository implements UserRepository {
  async findById(id: string) {
    // memory
  }

  async save(user: User) {
    // memory
  }
}
```

Важен контракт, а не конкретная реализация.

Это особенно естественно в NestJS/backend-коде:

```text
controller
   ↓
service
   ↓
repository interface
   ↓
PostgreSQL implementation
```

---

## Methods можно описывать двумя похожими способами

```ts
interface UserService {
  find(id: string): Promise<User>;
}
```

Или:

```ts
interface UserService {
  find: (id: string) => Promise<User>;
}
```

Оба варианта выглядят похоже, но это не абсолютно идентичные конструкции type system.

Первое — **method signature**.

Второе — property, значением которого является function.

Для большинства обычных application interfaces первый вариант читается естественнее:

```ts
interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
```

Но различие может стать важным при более глубоком разборе function variance.

---

## Interface может расширять другой interface

```ts
interface User {
  id: string;
  name: string;
}

interface Admin extends User {
  permissions: string[];
}
```

`Admin` должен содержать всё из `User` плюс собственные свойства:

```ts
const admin: Admin = {
  id: "u-1",
  name: "Alex",
  permissions: ["users:write"],
};
```

Можно расширить сразу несколько contracts:

```ts
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface SoftDeletable {
  deletedAt: Date | null;
}

interface User extends Timestamped, SoftDeletable {
  id: string;
  name: string;
}
```

Это удобно, когда отношения между object contracts действительно имеют смысл.

Но не стоит строить inheritance tree из десяти interfaces только потому, что TypeScript позволяет это сделать.

---

## `implements` проверяет class against interface

```ts
interface PaymentProcessor {
  process(amount: number): Promise<void>;
}

class StripeProcessor implements PaymentProcessor {
  async process(amount: number) {
    // ...
  }
}
```

`implements` означает:

> проверь, что instance этого class удовлетворяет interface.

Если забыть метод:

```ts
class StripeProcessor implements PaymentProcessor {
}
```

TypeScript выдаст ошибку.

Но `implements` **не меняет типы внутри class автоматически**.

Например interface не используется как способ вывести parameter types implementation:

```ts
interface Formatter {
  format(value: string): string;
}
```

При реализации всё равно нужно нормально типизировать class method.

То есть `implements` — это проверка соответствия, а не механизм наследования implementation.

---

## Важная особенность interface — declaration merging

В TypeScript можно объявить interface с одним именем несколько раз:

```ts
interface User {
  id: string;
}

interface User {
  name: string;
}
```

В результате TypeScript объединяет declarations:

```ts
const user: User = {
  id: "u-1",
  name: "Alex",
};
```

Conceptually:

```text
interface User { id: string }
+
interface User { name: string }

↓

interface User {
  id: string;
  name: string;
}
```

Это называется **declaration merging**.

Для обычного application code специально использовать это часто не нужно.

Но механизм очень важен для:

* library typings;
* global types;
* module augmentation;
* расширения типов сторонних библиотек.

Например ecosystem может расширить существующий request:

```ts
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
```

Это один из реальных случаев, где открытость `interface` действительно является преимуществом.

---

## Declaration merging может быть и риском

Поскольку interface открыт для расширения:

```ts
interface Config {
  port: number;
}
```

другой declaration с тем же именем может изменить общий контракт.

В application code обычно желательно, чтобы это происходило только намеренно.

У `type` другая семантика:

```ts
type Config = {
  port: number;
};

type Config = {
  host: string;
};

// Error: duplicate identifier
```

Type alias после создания не merge-ится.

Поэтому open nature interface — не автоматически «лучше». Это конкретная возможность с конкретными use cases.

---

## Interface умеет описывать не только обычные properties

Например callable object:

```ts
interface Formatter {
  (value: string): string;
}
```

Теперь:

```ts
const format: Formatter = value => value.trim();
```

Можно комбинировать call signature и properties:

```ts
interface Parser {
  (value: string): unknown;
  version: string;
}
```

Это моделирует JavaScript values, которые одновременно callable и имеют properties.

Такие конструкции чаще встречаются в typings libraries, чем в обычном business code, но показывают важный момент:

> interface описывает object-like shape, а не только DTO с полями.

---

## Interface не подходит для любого возможного типа

Например нельзя использовать interface как прямой alias для:

```ts
string | number
```

или:

```ts
[string, number]
```

Для этого существует `type`.

Interface ориентирован именно на object-like contracts.

---

## Когда я бы использовал interface

Хорошие кандидаты:

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

interface CacheProvider {
  get(key: string): Promise<string | null>;
}

interface AppConfig {
  port: number;
  host: string;
}
```

Особенно когда:

* тип представляет object contract;
* interface может расширяться;
* он является API между components;
* возможна library/module augmentation.

Но для обычного object type `type` тоже часто абсолютно нормален.

Само слово `interface` не делает архитектуру более SOLID.

---

## Вопросы на собеседовании

### Что такое interface в TypeScript?

`interface` — это именованный контракт для object-like структуры. Он описывает required properties, methods и другие signatures, а TypeScript проверяет structural compatibility значения с этим контрактом.

### Существует ли interface runtime?

Нет. TypeScript types удаляются при компиляции. `interface` не создаёт JavaScript constructor, object или runtime metadata.

### Что делает `implements`?

Он заставляет TypeScript проверить, что instance class совместим с указанным interface. При этом interface не предоставляет implementation и сам по себе не выводит типы implementation methods.

### Что такое declaration merging?

Несколько declarations одного `interface` с одинаковым именем могут быть объединены в один контракт. Это особенно важно для library typings и module augmentation.

### Обязательно ли использовать interface для всех object types?

Нет. Большинство object shapes можно описать как `interface`, так и `type`. Выбор становится важнее, когда нужны declaration merging, inheritance через `extends` или возможности type aliases, которых у interface нет.
