# 21. Generics

Generics позволяют написать код, который работает с разными типами, но при этом **не теряет информацию о конкретном типе**.

Без generic часто приходится либо дублировать функции:

```ts
function firstString(items: string[]): string | undefined {
  return items[0];
}

function firstNumber(items: number[]): number | undefined {
  return items[0];
}
```

либо использовать слишком широкий тип:

```ts
function first(items: any[]): any {
  return items[0];
}
```

Второй вариант reusable, но TypeScript больше не знает связь между входом и выходом.

Generic позволяет эту связь сохранить:

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

Теперь:

```ts
const name = first(["Alex", "Maria"]);
// string | undefined

const id = first([10, 20, 30]);
// number | undefined

const user = first([
  { id: "u-1", name: "Alex" },
]);
// { id: string; name: string } | undefined
```

`T` здесь означает:

> некоторый тип, который станет известен при использовании функции.

Главная идея generics:

```text
input type
   ↓
   T
   ↓
output type
```

Мы не говорим функции заранее работать именно со `string` или `User`.

Мы говорим:

> возьми тип caller-а, сохрани его и используй дальше в type relationship.

Именно сохранение type information — главная причина существования generics. Официальная документация TypeScript также описывает generic type parameter как способ захватить тип входа и затем использовать эту информацию в других местах signature.

---

## Generic — не то же самое, что `any`

Сравним:

```ts
function identity(value: any): any {
  return value;
}

const result = identity("hello");

result.nonExistingMethod();
// TypeScript не возражает
```

С `any` информация потеряна:

```text
string
↓
any
↓
any
```

Generic:

```ts
function identity<T>(value: T): T {
  return value;
}

const result = identity("hello");
```

TypeScript сохраняет relationship:

```text
string
↓
T = string
↓
string
```

Поэтому:

```ts
result.toUpperCase();       // OK
result.nonExistingMethod(); // Error
```

Generic не означает «любой тип без проверки».

Он означает:

> **функция может работать с разными типами, сохраняя конкретный тип каждого использования.**

---

## Type argument обычно выводится автоматически

Можно вызвать:

```ts
identity<string>("hello");
```

Здесь мы явно сказали:

```text
T = string
```

Но обычно это не нужно:

```ts
identity("hello");
```

TypeScript смотрит на argument и сам выводит `T`. Это называется **type argument inference**, и именно автоматический inference является обычным способом использования generic functions.

Например:

```ts
function wrap<T>(value: T) {
  return {
    value,
  };
}

const result = wrap({
  id: "u-1",
  active: true,
});
```

TypeScript выводит примерно:

```ts
{
  value: {
    id: string;
    active: boolean;
  };
}
```

Не нужно писать:

```ts
wrap<{
  id: string;
  active: boolean;
}>(...)
```

если compiler и так имеет достаточно информации.

Практическое правило то же, что и с обычным inference:

> explicit type argument нужен, когда он добавляет информацию или корректирует inference, а не когда просто повторяет очевидное.

---

## Generic нужен, когда между типами есть relationship

Посмотрим на такую функцию:

```ts
function log(value: string | number): void {
  console.log(value);
}
```

Нужен ли здесь generic?

Нет.

Функция принимает два типа, но между input и output никакой type relationship нет.

Generic вроде:

```ts
function log<T extends string | number>(value: T): void {
  console.log(value);
}
```

ничего полезного caller-у не даёт.

Теперь другой пример:

```ts
function toArray<T>(value: T): T[] {
  return [value];
}
```

Здесь generic важен:

```text
T
↓
T[]
```

Тип результата зависит от типа argument.

```ts
const a = toArray("hello");
// string[]

const b = toArray(123);
// number[]
```

Хороший вопрос при создании generic:

> **Какая type information проходит через этот API?**

Если ответ:

> никакая,

возможно, generic вообще не нужен.

---

## Generic должен появляться минимум в полезной relationship

Плохой пример:

```ts
function createId<T>(): string {
  return crypto.randomUUID();
}
```

`T` нигде не участвует в parameters или return value.

Caller может написать:

```ts
createId<User>();
createId<Order>();
createId<Date>();
```

но результат всё равно:

```ts
string
```

Type parameter здесь декоративный.

Ещё один suspicious pattern:

```ts
function print<T>(value: T): void {
  console.log(value);
}
```

Технически generic корректен, но если функция просто принимает любое значение и не использует relationship `T`, можно спросить, нужен ли type parameter вообще:

```ts
function print(value: unknown): void {
  console.log(value);
}
```

`unknown` здесь может точнее выражать intent:

> принимаю любое значение, но не обещаю сохранить его тип где-то ещё.

---

## Generic objects и interfaces

Generics применяются не только к функциям.

Например API response:

```ts
type ApiResponse<T> = {
  data: T;
  requestId: string;
};
```

Теперь:

```ts
type UserResponse =
  ApiResponse<User>;
```

получаем:

```ts
{
  data: User;
  requestId: string;
}
```

А:

```ts
type OrderResponse =
  ApiResponse<Order>;
```

получаем:

```ts
{
  data: Order;
  requestId: string;
}
```

Это хороший generic abstraction, потому что структура response одинаковая, а payload меняется.

Вместо:

```ts
type UserResponse = {
  data: User;
  requestId: string;
};

type OrderResponse = {
  data: Order;
  requestId: string;
};
```

мы описали общее правило один раз.

---

## Реальный пример: repository

```ts
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
}
```

Теперь:

```ts
class UserRepository
  implements Repository<User> {

  findById(id: string): Promise<User | null> {
    // ...
  }

  findAll(): Promise<User[]> {
    // ...
  }

  save(user: User): Promise<void> {
    // ...
  }
}
```

Здесь `T` связывает все operations repository:

```text
Repository<User>
       ↓
find → User
save → User
list → User[]
```

Это уже реальная architectural relationship.

Но здесь тоже важно не переусердствовать.

Если `UserRepository` и `OrderRepository` имеют сильно разную behavior:

```text
UserRepository
→ findByEmail
→ findActive

OrderRepository
→ findPending
→ lockForUpdate
→ findByPayment
```

попытка загнать всё в универсальный:

```ts
Repository<T>
```

может создать слабую abstraction.

Generics убирают повторение **type relationships**, но не обязаны убирать различия domain behavior.

---

## Generic class

Можно написать:

```ts
class Cache<T> {
  private value: T | undefined;

  set(value: T): void {
    this.value = value;
  }

  get(): T | undefined {
    return this.value;
  }
}
```

Использование:

```ts
const userCache = new Cache<User>();

userCache.set(user);

const cached = userCache.get();
// User | undefined
```

Весь instance теперь связан одним `T`.

TypeScript generic classes используют type parameter на instance side; static members не могут просто обращаться к class-level `T`, потому что static side общий для всех instances.

То есть такое conceptually невозможно:

```ts
class Cache<T> {
  static defaultValue: T;
}
```

Какой именно `T` должен использовать static property?

```ts
new Cache<User>();
new Cache<Order>();
```

Static member принадлежит `Cache` как constructor, а не отдельному `Cache<User>` instance.

---

## Не делай generic API сложнее, чем его runtime behavior

Можно создать красивый type-level API:

```ts
function fetchResource<T>(
  url: string
): Promise<T> {
  return fetch(url).then(
    response => response.json()
  );
}
```

Вызвать:

```ts
const user =
  await fetchResource<User>("/user");
```

И получить в IDE:

```ts
user: User
```

Но runtime `fetch()` ничего не знает о `T`.

Если server вернёт:

```json
{
  "banana": 123
}
```

TypeScript generic это не проверит.

Это принципиальный момент:

```text
generic type parameter
→ compile-time relationship

runtime data
→ всё ещё требует validation
```

`fetch<User>()` может быть удобным contract API, но сам по себе не превращает arbitrary JSON в проверенный `User`.

---

## Generic abstraction должна сохранять полезную информацию

Хороший generic:

```ts
function getFirst<T>(
  items: readonly T[]
): T | undefined
```

Связь очевидна:

```text
T[] → T
```

Хороший:

```ts
type Paginated<T> = {
  items: T[];
  total: number;
};
```

```text
T → Paginated<T>
```

Хороший:

```ts
function clone<T>(value: T): T
```

если runtime implementation действительно способна выполнить такой контракт.

Подозрительный:

```ts
function doSomething<T>(
  value: T
): boolean
```

Если `T` нигде больше не используется, generic может не добавлять caller-у никакой информации.

Полезный вопрос при code review:

> Если заменить `T` на `unknown`, какую type information мы потеряем?

Если ответ:

> никакую,

generic, возможно, лишний.

---

## Вопросы на собеседовании

### Что такое generics в TypeScript?

Generics позволяют параметризовать type relationship. Вместо конкретного типа функция, class или type принимает type parameter и может сохранить связь между input и output без перехода к `any`.

### Чем generic отличается от `any`?

`any` теряет type information и отключает значительную часть проверки. Generic захватывает конкретный тип caller-а и позволяет использовать его дальше, сохраняя type safety.

### Нужно ли всегда явно передавать `<T>`?

Нет. В generic functions TypeScript обычно выводит type arguments из переданных arguments. Я указываю их явно только когда inference недостаточен или хочу намеренно задать более широкий/конкретный тип.

### Когда generic не нужен?

Когда type parameter не создаёт полезной связи между частями API. Если функция просто принимает любое значение и возвращает `boolean` или `void`, иногда `unknown` или обычный union точнее и проще.

### Может ли `fetch<User>()` гарантировать, что server вернул `User`?

Нет. Generic существует только compile time. External runtime data всё равно нужно валидировать, если его структуре нельзя доверять.

### Когда generic abstraction становится плохой?

Когда она пытается скрыть реальные domain differences или требует сложной type machinery без заметного выигрыша для caller-а. Generics должны выражать реальную повторяющуюся relationship, а не делать API «более универсальным» любой ценой.
