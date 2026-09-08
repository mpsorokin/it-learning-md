# 10. `interface` vs `type`

Это один из самых популярных TypeScript interview questions, но плохой ответ обычно выглядит так:

> `interface` — для объектов, `type` — для всего остального.

Это направление в целом полезное, но реальность немного сложнее.

Для большинства обычных object types оба варианта работают одинаково хорошо:

```ts
interface User {
  id: string;
  name: string;
}
```

и:

```ts
type User = {
  id: string;
  name: string;
};
```

В большинстве application code разница здесь минимальна.

Поэтому вопрос лучше формулировать так:

> **В каких ситуациях возможности `interface` и `type` начинают различаться?**

---

## `type` может описывать больше видов типов

Interface в первую очередь предназначен для object-like shapes.

Type alias может описать union:

```ts
type Status =
  | "pending"
  | "completed"
  | "failed";
```

Tuple:

```ts
type Coordinates = [
  number,
  number
];
```

Function:

```ts
type Handler =
  (event: Event) => void;
```

Primitive alias:

```ts
type UserId = string;
```

И advanced transformations:

```ts
type Keys = keyof User;
```

Поэтому если тип **не является обычным object contract**, `type` часто является естественным выбором.

---

## Главное уникальное свойство interface — declaration merging

```ts
interface User {
  id: string;
}

interface User {
  name: string;
}
```

TypeScript объединит declarations:

```ts
interface User {
  id: string;
  name: string;
}
```

С `type` так нельзя:

```ts
type User = {
  id: string;
};

type User = {
  name: string;
};

// Error
```

Это одно из самых фундаментальных различий.

Declaration merging особенно полезен для:

* `.d.ts`;
* third-party library augmentation;
* globals;
* framework ecosystems.

Но внутри обычного backend application это требуется значительно реже.

---

## Extending: `interface extends` vs intersection

Interface:

```ts
interface User {
  id: string;
}

interface Admin extends User {
  permissions: string[];
}
```

Type:

```ts
type User = {
  id: string;
};

type Admin =
  User & {
    permissions: string[];
  };
```

В простом случае результат почти одинаков:

```text
Admin
→ id
→ permissions
```

Но semantics при конфликте отличаются.

---

## Conflict handling — важное различие

Допустим:

```ts
interface A {
  value: string;
}

interface B extends A {
  value: number;
}
```

TypeScript сразу сообщает, что `B` не может корректно расширить `A`, потому что `number` несовместим со `string`.

Это хороший failure mode:

> ошибка появляется в месте определения типа.

Теперь intersection:

```ts
type A = {
  value: string;
};

type B = A & {
  value: number;
};
```

TypeScript может построить intersection.

Но `value` должен одновременно быть:

```text
string
AND
number
```

То есть:

```ts
type Value = B["value"];
// never
```

Ошибка может проявиться позже, когда кто-то попробует создать или использовать `B`.

Это одна из причин, почему `extends` иногда даёт более понятные ошибки для object inheritance.

---

## Не превращай intersections в inheritance system

Можно построить:

```ts
type Entity = {
  id: string;
};

type Timestamped = {
  createdAt: Date;
};

type SoftDeletable = {
  deletedAt: Date | null;
};

type User =
  Entity &
  Timestamped &
  SoftDeletable & {
    name: string;
  };
```

Технически всё нормально.

Но если каждый domain object становится intersection из семи utility types, тип может быть сложнее читать, чем явный contract.

То же самое относится к interfaces:

```ts
interface User
  extends Entity,
    Timestamped,
    SoftDeletable,
    Auditable,
    Versioned {
}
```

TypeScript предоставляет composition mechanisms, но не гарантирует, что composition делает domain model понятнее.

---

## Для library API interface часто имеет преимущество

Представим library:

```ts
interface PluginOptions {
  enabled: boolean;
}
```

Другой package может намеренно расширить его:

```ts
declare module "some-library" {
  interface PluginOptions {
    customFeature?: boolean;
  }
}
```

Это возможно благодаря open nature interfaces.

Для library ecosystems такое поведение бывает очень полезно.

Для закрытого application model иногда хочется обратного:

> этот type объявлен здесь и больше нигде не должен расширяться декларативно.

Тогда closed nature `type` может быть вполне привлекательной.

---

## Для unions вопрос вообще исчезает

Если нужна модель состояния:

```ts
type RequestState =
  | {
      status: "loading";
    }
  | {
      status: "success";
      data: User;
    }
  | {
      status: "error";
      error: Error;
    };
```

`interface` не является альтернативой всему этому union.

Можно использовать interfaces для отдельных members:

```ts
interface SuccessState {
  status: "success";
  data: User;
}

interface ErrorState {
  status: "error";
  error: Error;
}

type RequestState =
  | SuccessState
  | ErrorState;
```

Но сам union всё равно требует `type`.

Поэтому в modern TypeScript codebase `interface` и `type` часто прекрасно используются вместе.

---

## А что с classes?

Для contract, который реализуют classes, `interface` обычно выглядит естественно:

```ts
interface UserRepository {
  find(id: string): Promise<User | null>;
}
```

```ts
class PostgresUserRepository
  implements UserRepository {
  // ...
}
```

Но object type alias тоже может использоваться с `implements` в подходящих случаях:

```ts
type UserRepository = {
  find(id: string): Promise<User | null>;
};
```

То есть утверждение:

> class может implements только interface

неверно.

Выбор здесь скорее про design/readability, чем про жёсткое ограничение TypeScript.

---

## Compiler performance тоже может отличаться

Для больших и сложных type graphs интерфейсы с `extends` могут быть более удобны compiler-у, чем многократно вычисляемые intersections.

В обычном application code это **не причина переписывать все types в interfaces**.

Но для:

* огромных library typings;
* сложных generated types;
* очень больших monorepo;
* deeply composed public APIs;

форма типов может влиять и на compiler/editor performance.

Это скорее engineering consideration для больших type systems, а не daily rule.

---

## Что использовать на практике?

Нормальная стратегия может быть очень простой.

### Используй `interface`, когда:

тип прежде всего является расширяемым object contract:

```ts
interface UserRepository {}
interface PluginOptions {}
interface RequestContext {}
```

Особенно если:

* нужен `extends`;
* ожидается declaration merging;
* это public library API;
* interface хорошо выражает архитектурный intent.

### Используй `type`, когда:

нужен:

```text
union
tuple
function alias
intersection
mapped type
conditional type
primitive alias
type transformation
```

Например:

```ts
type Status =
  | "pending"
  | "completed";

type Coordinates =
  [number, number];

type Handler =
  (request: Request) => Promise<Response>;
```

### Для обычного object:

```ts
interface User {
  id: string;
}
```

vs

```ts
type User = {
  id: string;
};
```

в большинстве случаев это **style/design choice**.

Не стоит проводить code review на уровне:

> тут type, а я предпочитаю interface.

если технического преимущества в конкретном месте нет.

---

## Хорошая командная стратегия

На реальном проекте consistency часто важнее личной религии вокруг `type` и `interface`.

Например команда может решить:

```text
interface
→ service/repository/public object contracts

type
→ DTO unions, aliases, tuples, transformations
```

Или даже:

```text
type by default
interface only when declaration merging is needed
```

Обе стратегии могут быть нормальными.

Плохая стратегия:

```text
"interface всегда лучше"
```

или:

```text
"type современный, interface legacy"
```

Оба утверждения слишком упрощают TypeScript.

---

## Вопросы на собеседовании

### В чём главное различие между `interface` и `type`?

Оба могут описывать object shapes. Главное функциональное различие в том, что interfaces поддерживают declaration merging и ориентированы на object-like contracts, тогда как type aliases могут именовать практически любые type expressions: unions, tuples, primitives, functions, intersections и advanced type transformations.

### Что использовать для обычного object type?

В большинстве случаев оба варианта корректны. Я обычно выбираю исходя из conventions проекта и intent: interface хорошо выражает расширяемый object contract, type удобен, если модель участвует в unions или type-level composition.

### Чем `extends` отличается от intersection?

Для совместимых object types результат часто похож. Но при конфликтах `interface extends` обычно выдаёт ошибку непосредственно при объявлении несовместимого interface, тогда как intersection может создать property типа `never`. Поэтому semantics ошибок и composition отличаются.

### Поддерживает ли `type` declaration merging?

Нет. Type alias нельзя повторно открыть и дополнить другим declaration с тем же именем. Interface можно.

### Можно ли class `implements` type alias?

Да, если alias описывает подходящий object contract. `implements` не ограничен только interfaces.

### Что лучше для library typings?

Часто `interface`, если consumers должны иметь возможность расширять declarations через module augmentation. Но это зависит от конкретного API.

### Есть ли правило «всегда использовать interface»?

Нет. Даже официальный TypeScript guidance рассматривает выбор во многих object-only случаях как вопрос предпочтения, пока не появляется feature, которая требует конкретной конструкции. На практике важнее выбрать инструмент, который точнее выражает модель и остаётся понятным команде.
