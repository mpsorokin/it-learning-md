# 5. Tuples

Tuple — это массив, в котором **тип зависит от позиции элемента**.

```ts
type Coordinates = [number, number];

const point: Coordinates = [44.43, 26.10];
```

В обычном массиве:

```ts
const values: (string | number)[] = [
  "Alex",
  30,
];
```

TypeScript знает только:

> каждый элемент может быть `string` или `number`.

Поэтому допустимо:

```ts
values.push("Maria");
values.push(42);
```

Tuple описывает гораздо более строгую структуру:

```ts
type UserEntry = [string, number];

const entry: UserEntry = [
  "Alex",
  30,
];
```

Здесь:

```ts
entry[0]; // string
entry[1]; // number
```

То есть tuple — это не просто «короткий массив», а **positional contract**.

---

## Когда tuple действительно уместен

Tuple хорошо работает, когда позиции имеют очевидную и небольшую семантику.

Например key-value pair:

```ts
type UserEntry = [string, User];

function getEntry(): UserEntry {
  return ["u-123", user];
}

const [id, user] = getEntry();
```

Или диапазон:

```ts
type Range = [number, number];

const range: Range = [10, 20];

const [min, max] = range;
```

Здесь порядок очевиден:

```text
[min, max]
[id, user]
[key, value]
```

Tuple особенно удобен, когда destructuring является естественной частью API.

---

## Когда object лучше tuple

Такой tuple технически допустим:

```ts
type UserStats = [
  number,
  number,
  boolean,
  string
];
```

Но caller должен помнить:

```text
0 → posts
1 → followers
2 → verified
3 → plan
```

Это плохой API.

Лучше:

```ts
type UserStats = {
  posts: number;
  followers: number;
  verified: boolean;
  plan: string;
};
```

Теперь смысл каждого поля выражен самим типом.

Практическое правило:

```text
2–3 значения с очевидной positional semantics
→ tuple

domain object с именованными полями
→ object
```

Tuple не стоит использовать просто ради того, чтобы написать меньше символов.

---

## Named tuples улучшают читаемость

TypeScript позволяет подписывать позиции:

```ts
type Coordinates = [
  latitude: number,
  longitude: number
];
```

Или:

```ts
type Pagination = [
  page: number,
  pageSize: number
];
```

Это не создаёт runtime properties:

```ts
coordinates.latitude
// такого свойства нет
```

Tuple остаётся обычным массивом.

Labels нужны только для:

* IDE hints;
* readability;
* документации позиции.

На совместимость типов они практически не влияют.

---

## Optional tuple elements

Tuple может содержать optional positions:

```ts
type LogEntry = [
  message: string,
  error?: Error
];
```

Теперь допустимы:

```ts
const a: LogEntry = ["Failed request"];

const b: LogEntry = [
  "Failed request",
  new Error("Timeout"),
];
```

Это бывает удобно для небольших internal APIs, но большое количество optional positions быстро ухудшает понятность.

Например:

```ts
type Config = [
  string,
  number?,
  boolean?,
  string?
];
```

уже выглядит подозрительно.

В таком случае object обычно лучше.

---

## Rest elements в tuple

Tuple может описывать и variadic structure:

```ts
type Command = [
  name: string,
  ...args: string[]
];
```

Допустимы:

```ts
const a: Command = ["build"];

const b: Command = [
  "deploy",
  "--production",
  "--force",
];
```

Это полезно, когда начало структуры фиксировано, а хвост имеет повторяющийся тип.

Tuple types также хорошо работают с rest parameters:

```ts
type LogArgs = [
  message: string,
  error?: Error
];

function log(...args: LogArgs) {
  const [message, error] = args;
}
```

Так можно описывать function call shape как отдельный тип.

---

## `readonly` tuple

Обычный tuple mutable:

```ts
const point: [number, number] = [10, 20];

point[0] = 30; // OK
```

Если структура должна быть immutable на уровне type checker:

```ts
const point: readonly [number, number] = [10, 20];

point[0] = 30;
// Error
```

`as const` часто создаёт именно readonly tuple:

```ts
const roles = ["admin", "user"] as const;
```

TypeScript выводит:

```ts
readonly ["admin", "user"]
```

а не:

```ts
string[]
```

Это очень важный механизм, потому что теперь compiler сохраняет **точные literal values и их позиции**.

Позже из такого tuple можно строить типы вроде:

```ts
type Role = typeof roles[number];
// "admin" | "user"
```

Это будет подробно разбираться в `as const`, но здесь важно понимать, почему результат именно tuple.

---

## Tuple не гарантирует runtime данные

Как и любой TypeScript type:

```ts
type Coordinates = [number, number];
```

не проверяет внешний JSON.

Если API вернул:

```json
["44.43", null]
```

TypeScript сам runtime-проверку не выполнит.

Tuple описывает compile-time contract, а не валидирует реальные данные.

---

## Вопросы на собеседовании

### Чем tuple отличается от array?

Array описывает коллекцию элементов, где отдельная позиция обычно не имеет собственного типа. Tuple описывает positional structure: TypeScript знает тип каждого конкретного элемента по его индексу.

### Когда tuple лучше object?

Когда структура маленькая, порядок естественен и понятен без дополнительных имён — например `[key, value]`, `[min, max]` или результат, который сразу destructure-ится. Если позиции приходится запоминать, object обычно лучше.

### Что дают labels в tuple?

Они улучшают IDE hints и читаемость:

```ts
type Range = [
  min: number,
  max: number
];
```

Но не создают properties `min` и `max` runtime и не меняют tuple в object.

### Что делает `as const` с array literal?

Он сохраняет literal types и превращает массив в readonly tuple:

```ts
const roles = ["admin", "user"] as const;
// readonly ["admin", "user"]
```
