# Arrays

В TypeScript массив обычно описывается как:

```ts
string[]
User[]
Order[]
```

или через generic syntax:

```ts
Array<string>
Array<User>
```

Для обычных случаев:

```ts
User[]
```

и:

```ts
Array<User>
```

означают одно и то же.

`T[]` обычно компактнее, поэтому чаще используется в application code.

---

## Element type распространяется на весь API массива

```ts
const users: User[] = [];
```

TypeScript знает, что элементы должны быть `User`.

```ts
users.push({
  id: "u-1",
  name: "Alex",
});
```

Но:

```ts
users.push("Alex");
// Error
```

Эта информация используется и методами массива:

```ts
const names = users.map(user => user.name);
```

TypeScript выводит:

```ts
string[]
```

Параметр `user` тоже не нужно аннотировать вручную:

```ts
users.map((user: User) => user.name);
```

Annotation здесь избыточна, потому что callback получает contextual type из `User[]`.

---

## Inference массива

TypeScript может вывести element type автоматически:

```ts
const ids = [1, 2, 3];
// number[]
```

Если элементы разных типов:

```ts
const values = [
  1,
  "pending",
  2,
];
```

получится тип вроде:

```ts
(number | string)[]
```

Это означает:

> каждый элемент массива может быть `number` или `string`.

Например:

```ts
values.push("completed"); // OK
values.push(10);          // OK
```

Но это не значит:

```text
index 0 → number
index 1 → string
index 2 → number
```

Для positional typing существуют tuples.

---

## Не делай union array без необходимости

Иногда разработчик видит:

```ts
(User | Admin | Guest)[]
```

и думает, что это уже плохо.

Сам по себе union array вполне нормальный:

```ts
type SearchResult =
  | UserResult
  | ProductResult;

const results: SearchResult[] = [];
```

Проблема появляется, если downstream code постоянно вынужден гадать, что лежит внутри:

```ts
for (const item of results) {
  if ("email" in item) {
    // ...
  } else {
    // ...
  }
}
```

Тогда стоит посмотреть, соответствует ли такой массив реальной domain model или данные лучше разделить.

TypeScript не может решить архитектуру за тебя — он только корректно моделирует выбранную структуру.

---

## `readonly T[]` — очень полезный API design tool

Рассмотрим:

```ts
function calculateTotal(orders: Order[]) {
  return orders.reduce(
    (sum, order) => sum + order.total,
    0
  );
}
```

Функция не изменяет массив, но её type разрешает mutation:

```ts
function calculateTotal(orders: Order[]) {
  orders.sort(...);
  orders.pop();

  // technically allowed
}
```

Если mutation функции не нужна:

```ts
function calculateTotal(
  orders: readonly Order[]
) {
  return orders.reduce(
    (sum, order) => sum + order.total,
    0
  );
}
```

Теперь:

```ts
orders.push(newOrder);
// Error

orders.pop();
// Error
```

При этом обычный mutable array всё равно можно передать:

```ts
const orders: Order[] = [];

calculateTotal(orders);
```

Это сильная идея:

> параметр функции должен давать implementation только те permissions, которые ей действительно нужны.

Если функция только читает коллекцию, `readonly T[]` часто точнее, чем `T[]`.

---

## `readonly` не делает элементы immutable

Важно не перепутать:

```ts
const users: readonly User[] = [];
```

Это запрещает изменение структуры массива:

```ts
users.push(...); // Error
users.pop();     // Error
```

Но если сам `User` mutable:

```ts
users[0].name = "Maria";
```

может быть разрешено.

`readonly User[]` означает:

> нельзя мутировать массив через этот reference.

Он не превращает каждый `User` в `Readonly<User>`.

---

## Индексация массива не гарантирует существование элемента

```ts
const users: User[] = [];

const user = users[0];
```

Runtime результат здесь очевиден:

```ts
undefined
```

Но обычная типизация массива исторически довольно permissive относительно index access.

Поэтому код:

```ts
users[0].name
```

может выглядеть безопаснее на уровне типов, чем он является runtime.

Для более строгого поведения существует:

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

Тогда index access учитывает отсутствие элемента:

```ts
const user = users[0];
// User | undefined
```

и требуется явная проверка:

```ts
const user = users[0];

if (user) {
  console.log(user.name);
}
```

Для backend/application code это довольно полезная настройка, потому что она делает реальный runtime risk видимым в type system.

---

## `map`, `filter` и типы

`map()` преобразует element type:

```ts
const users: User[] = getUsers();

const ids = users.map(user => user.id);
// string[]
```

`filter()` интереснее.

Например:

```ts
const users: Array<User | null> = getUsers();

const filtered = users.filter(user => user !== null);
```

Современный TypeScript умеет во многих подобных случаях narrowing результата, поэтому `filtered` может стать `User[]`.

Но при более сложной логике может потребоваться explicit type guard.

Это важно понимать концептуально:

```text
map
→ меняет element type через transformation

filter
→ может сужать element type
```

---

## Массив vs tuple

Если ты пишешь:

```ts
const result: (string | number)[] = [
  "Alex",
  10,
];
```

TypeScript не гарантирует meaning конкретной позиции.

Можно сделать:

```ts
result.push(20);
result.push("Maria");
```

Если смысл именно такой:

```text
index 0 → user name
index 1 → age
```

нужен tuple:

```ts
const result: [string, number] = [
  "Alex",
  10,
];
```

То есть:

```text
array
→ collection

tuple
→ positional structure
```

## Interview questions

### Есть ли разница между `T[]` и `Array<T>`?

Для обычного массива — практически нет. Это два синтаксиса одной модели массива. `T[]` короче, а `Array<T>` иногда удобнее читать внутри сложных generic types.

### Зачем использовать `readonly T[]`?

Чтобы явно показать, что функция или API не должны изменять коллекцию. Это уменьшает permissions implementation и делает контракт сильнее. При этом обычный mutable `T[]` можно передать туда, где ожидается `readonly T[]`.

### Делает ли `readonly User[]` объекты `User` immutable?

Нет. Он запрещает mutation самой коллекции через данный reference. Чтобы запретить изменение properties элементов, нужно отдельно моделировать immutable/readonly element type.

### Почему `users[0]` потенциально опасен?

Потому что тип элемента массива не гарантирует существование конкретного index. Runtime результат может быть `undefined`. `noUncheckedIndexedAccess` позволяет TypeScript отражать этот риск в типе как `User | undefined`.

### Чем `(string | number)[]` отличается от `[string, number]`?

Первое — массив, каждый элемент которого может быть `string` или `number`. Второе — tuple: на первой позиции всегда ожидается `string`, а на второй — `number`.
