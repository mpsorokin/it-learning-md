---
title: Type Annotations
titleRu: Аннотации типов
slug: type-annotations
section: foundation
order: 2
difficulty: beginner
estimatedMinutes: 6
tags:
  - typescript
  - annotations
prerequisites:
  - type-inference
---

# Type Annotations

Type annotation — это явное указание типа в месте, где мы хотим **зафиксировать ограничение или контракт**, а не просто повторить то, что TypeScript и так способен вывести.

```ts
let retries: number = 3;

function findUser(id: string): User | null {
  // ...
}
```

В первом случае мы говорим: `retries` должна оставаться `number`.

Во втором задаём сразу два контракта:

* функция принимает `string`;
* функция возвращает `User | null`.

## Когда annotation не нужна

Такой код обычно избыточен:

```ts
const port: number = 3000;
const enabled: boolean = true;
const name: string = "Alex";
```

TypeScript и так выводит эти типы:

```ts
const port = 3000;
const enabled = true;
const name = "Alex";
```

То же относится к результатам уже типизированных функций:

```ts
const users: User[] = await repository.find();
```

Если `repository.find()` уже возвращает:

```ts
Promise<User[]>
```

то annotation ничего не добавляет:

```ts
const users = await repository.find();
```

Хороший TypeScript-код обычно не стремится аннотировать каждую переменную. Иначе появляется много дублирования, которое ухудшает readability, но почти не увеличивает type safety.

---

## Annotation может намеренно расширять тип

Иногда annotation нужна именно потому, что inferred type слишком конкретный.

```ts
const environment = "production";
// "production"

const configuredEnvironment: string = "production";
// string
```

В первом случае значение известно точно: `"production"`.

Во втором мы сознательно говорим:

> здесь может быть любой `string`, текущее значение просто `"production"`.

Это полезно, например, когда переменная должна позже изменяться или участвовать в более широком API.

```ts
let environment: "development" | "production" = "development";

environment = "production"; // OK
environment = "test";       // Error
```

Здесь annotation уже задаёт полезное ограничение.

---

## Parameters почти всегда требуют явного контракта

Возьмём функцию:

```ts
function calculateDiscount(price, percent) {
  return price * (1 - percent);
}
```

TypeScript не может догадаться, что caller должен иметь право передавать.

Мы должны это определить:

```ts
function calculateDiscount(
  price: number,
  percent: number
) {
  return price * (1 - percent);
}
```

Return type при этом TypeScript спокойно выведет как `number`.

Это важное различие:

```text
parameters
→ описывают входной контракт
→ чаще требуют explicit type

return value
→ часто можно вывести из implementation
```

---

## Когда стоит явно писать return type

Для небольшого helper-а:

```ts
function calculateTotal(orders: Order[]) {
  return orders.reduce(
    (sum, order) => sum + order.price,
    0
  );
}
```

`number` очевидно выводится автоматически.

Но на важной границе приложения explicit return type может быть полезен:

```ts
function toPublicUser(user: User): PublicUserDto {
  return {
    id: user.id,
    name: user.name,
  };
}
```

Здесь `PublicUserDto` — не подсказка compiler-у.

Это контракт:

> независимо от того, как меняется implementation, наружу должна выходить структура `PublicUserDto`.

Представим, что кто-то случайно изменил код:

```ts
function toPublicUser(user: User): PublicUserDto {
  return {
    id: user.id,
    name: user.name,
    passwordHash: user.passwordHash,
  };
}
```

Явная boundary заставляет TypeScript проверить implementation относительно ожидаемой публичной структуры.

Поэтому вопрос не должен звучать:

> Нужно ли всегда писать return types?

Правильнее:

> Есть ли здесь контракт, который стоит зафиксировать независимо от реализации?

---

## Annotation и assertion — не одно и то же

Это annotation:

```ts
const user: User = value;
```

TypeScript проверяет:

> совместимо ли `value` с `User`?

А это assertion:

```ts
const user = value as User;
```

Здесь разработчик говорит compiler-у:

> считай это `User`.

Assertion потенциально гораздо опаснее, потому что может использоваться для обхода части проверок.

Поэтому если задача — **проверить соответствие контракту**, annotation обычно сильнее и честнее.

---

## Практическое правило

Используй inference, когда тип очевидно следует из кода:

```ts
const total = 100;
const users = await repository.find();
```

Используй annotation, когда она добавляет новую информацию:

```ts
let status: "pending" | "completed" = "pending";

function save(user: User): Promise<void> {
  // ...
}
```

И особенно там, где ты сознательно устанавливаешь boundary:

```ts
export function getUser(id: string): PublicUserDto {
  // ...
}
```

## Interview questions

### Should you explicitly type every variable?

No. If TypeScript already infers the type unambiguously, an annotation usually just duplicates information. Explicit types are more useful where they add a constraint, a contract, or an important domain abstraction.

### Should you always annotate a function's return type?

No. For internal implementation functions, inference is often cleaner. On public APIs, domain boundaries, or exported functions, an explicit return type is useful because it locks the contract independently of how the implementation changes.

### How does an annotation differ from `as`?

An annotation asks TypeScript to check a value against the given type. `as` is an assertion: the developer tells the compiler how to treat the value. That means an assertion can hide a problem that a normal annotation would have caught.
