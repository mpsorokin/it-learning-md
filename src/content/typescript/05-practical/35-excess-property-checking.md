# 35. Excess Property Checking

На первый взгляд следующий код выглядит странно.

Есть type:

```ts
type User = {
  id: string;
  name: string;
};
```

Это работает:

```ts
const data = {
  id: "u-1",
  name: "Alex",
  age: 30,
};

const user: User = data;
```

Но если написать object literal напрямую:

```ts
const user: User = {
  id: "u-1",
  name: "Alex",
  age: 30,
};
```

TypeScript может сказать:

```text
Object literal may only specify known properties
```

Почему один и тот же shape сначала разрешён, а потом нет?

Потому что TypeScript применяет к **fresh object literals дополнительную excess property check**.

---

## Это не отменяет structural typing

Structural compatibility говорит:

```text
source contains everything target requires
→ compatible
```

Поэтому:

```ts
const data = {
  id: "u-1",
  name: "Alex",
  age: 30,
};

const user: User = data;
```

нормально.

`data` имеет:

```text
id
name
age
```

а `User` требует только:

```text
id
name
```

Но direct object literal часто является местом, где extra property скорее означает **typo или неправильное понимание API**, чем намеренно более широкий object.

Поэтому TypeScript делает дополнительную проверку.

---

## Зачем это вообще нужно

Представим:

```ts
type CreateUserOptions = {
  sendEmail?: boolean;
};
```

Caller пишет:

```ts
createUser({
  sendEamil: true,
});
```

Опечатка:

```text
sendEamil
```

вместо:

```text
sendEmail
```

С чистой structural логикой object мог бы просто иметь дополнительное property, которое функция игнорирует.

Это было бы неприятно:

```text
caller думает:
email отправится

runtime:
property никому не известно
→ silently ignored
```

Excess property checking ловит такой класс ошибок непосредственно на object literal boundary.

---

## Fresh object literal проверяется строже

Например:

```ts
function createUser(options: {
  name: string;
  active?: boolean;
}) {
}
```

Прямой вызов:

```ts
createUser({
  name: "Alex",
  activ: true,
});
```

ошибка.

И это полезно:

```text
activ
vs
active
```

Но:

```ts
const options = {
  name: "Alex",
  activ: true,
};

createUser(options);
```

может пройти, потому что теперь выполняется обычная structural compatibility check:

```text
есть name: string?
→ yes
```

Extra `activ` не нарушает required structure.

---

## Это не способ запрещать дополнительные properties runtime

Очень важно.

Если API требует:

> объект должен содержать **только** эти properties,

TypeScript excess property checking не является надёжным runtime mechanism.

Например:

```ts
const data = {
  id: "u-1",
  name: "Alex",
  passwordHash: "secret",
};

const user: PublicUser =
  data;
```

assignment может быть structural valid.

И runtime object всё равно содержит:

```text
passwordHash
```

TypeScript type:

```ts
PublicUser
```

не удаляет property из JavaScript object.

Если нужно реально sanitize output:

```ts
const {
  passwordHash,
  ...publicUser
} = data;
```

или использовать explicit mapper/serializer.

---

## Type assertion может обойти excess property check

Например:

```ts
const user = {
  id: "u-1",
  name: "Alex",
  age: 30,
} as User;
```

Теперь developer фактически говорит:

> trust me.

Это может убрать ошибку, но не означает, что проблема исчезла.

Использовать:

```ts
as User
```

только чтобы заставить compiler замолчать — обычно плохой pattern.

Нужно понять, что именно мы хотим выразить.

---

## `satisfies` часто лучше annotation или assertion

Допустим:

```ts
type Config = {
  host: string;
  port: number;
};
```

Мы хотим проверить object:

```ts
const config = {
  host: "localhost",
  port: 3000,
  debug: true,
};
```

Если написать:

```ts
const config: Config = {
  ...
};
```

лишнее `debug` может быть rejected.

Если написать:

```ts
const config = {
  ...
} as Config;
```

мы начинаем обходить часть checking.

Во многих случаях правильная мысль:

```ts
const config = {
  host: "localhost",
  port: 3000,
} satisfies Config;
```

`satisfies` будет отдельной темой, но важно понимать relationship:

> excess property checking часто появляется именно в местах, где object literal проверяется против expected object contract.

---

## Index signature разрешает дополнительные keys намеренно

Если API действительно поддерживает arbitrary properties:

```ts
type Metadata = {
  id: string;

  [key: string]: unknown;
};
```

Теперь:

```ts
const metadata: Metadata = {
  id: "m-1",
  source: "api",
  retries: 3,
};
```

extra properties являются частью самого contract.

Но не нужно добавлять:

```ts
[key: string]: unknown;
```

только чтобы избавиться от excess property errors.

Это резко расширяет API:

> любой string key теперь считается допустимым.

---

## Weak contracts с большим количеством optional fields требуют внимания

Например:

```ts
type Options = {
  timeout?: number;
  retries?: number;
  cache?: boolean;
};
```

Excess property checking особенно полезен именно здесь.

Без него:

```ts
{
  timeuot: 5000
}
```

формально не нарушает ни одного required property — required properties вообще нет.

Но смысл API явно нарушен.

Fresh object checking спасает от таких silent mistakes.

---

## Почему поведение сначала кажется inconsistent

Потому что TypeScript решает две разные задачи.

### Structural compatibility

```text
можно ли использовать этот value там,
где требуется target type?
```

### Excess property checking

```text
не выглядит ли свежий object literal
как ошибочно составленный target object?
```

Это две разные проверки.

Поэтому:

```ts
const x = {
  name: "Alex",
  age: 30,
};

const user: User = x;
```

и:

```ts
const user: User = {
  name: "Alex",
  age: 30,
};
```

могут вести себя по-разному без противоречия type system.

---

## Не используй intermediate variable как hack

Иногда предлагают:

```ts
const tmp = {
  id: "u-1",
  name: "Alex",
  wrongField: true,
};

const user: User =
  tmp;
```

только чтобы обойти excess property error.

Технически работает.

Но если `wrongField` действительно является ошибкой, это просто обход safety feature.

Intermediate variable имеет смысл, когда объект **действительно шире**, чем contract:

```ts
const databaseUser = {
  id: "u-1",
  name: "Alex",
  passwordHash: "...",
  createdAt: new Date(),
};

const user: User =
  databaseUser;
```

Это normal structural subtyping.

---

## Вопросы на собеседовании

### Что такое excess property checking?

Это дополнительная проверка TypeScript для fresh object literals, которая обнаруживает properties, отсутствующие в ожидаемом target type.

### Почему object через переменную может пройти, а literal напрямую — нет?

Переменная проверяется в основном по structural compatibility: содержит ли она необходимые members. Fresh object literal дополнительно проверяется на подозрительные extra properties.

### Противоречит ли это structural typing?

Нет. Excess property checking — дополнительная safety heuristic поверх structural type system.

### Запрещает ли excess property checking лишние runtime properties?

Нет. TypeScript не удаляет properties и не выполняет runtime validation. Если нужно реально ограничить или sanitize object, требуется runtime logic.

### Стоит ли создавать intermediate variable только чтобы обойти эту проверку?

Нет. Если extra property является ошибкой, это просто обход полезной проверки. Такой assignment нормален только тогда, когда source object действительно намеренно шире target contract.

---
