# 9. Type Aliases

`type` позволяет дать имя **любому TypeScript type expression**.

Самый простой пример:

```ts
type UserId = string;
```

Или object:

```ts
type User = {
  id: string;
  name: string;
};
```

Но главное отличие `type` от `interface` становится видно дальше: type alias не ограничен object shapes.

Он может описывать:

* primitives;
* unions;
* tuples;
* functions;
* object types;
* intersections;
* более сложные type-level transformations.

Поэтому название `type alias` довольно точное:

> мы даём имя уже существующему type expression.

---

## Type alias для union

Один из самых частых use cases:

```ts
type Status =
  | "pending"
  | "processing"
  | "completed"
  | "failed";
```

Теперь вместо повторения union:

```ts
function updateStatus(
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
) {
}
```

используем:

```ts
function updateStatus(status: Status) {
}
```

Alias делает type concept частью vocabulary codebase.

`Status` уже означает не просто набор строк, а domain concept.

---

## Type alias для tuple

```ts
type Coordinates = [
  latitude: number,
  longitude: number
];

const bucharest: Coordinates = [
  44.4268,
  26.1025,
];
```

Interface напрямую так описать tuple не может.

---

## Type alias для function type

```ts
type UserFilter = (
  user: User
) => boolean;
```

Использование:

```ts
const isActive: UserFilter =
  user => user.active;
```

Или callback API:

```ts
type ErrorHandler = (
  error: Error,
  requestId: string
) => void;
```

Для function types `type` часто читается очень естественно.

---

## Alias не создаёт новый nominal type

Это важный нюанс.

```ts
type UserId = string;
type OrderId = string;
```

Можно ожидать, что TypeScript теперь различает эти типы.

Но:

```ts
const userId: UserId = "123";
const orderId: OrderId = userId;
```

это допустимо.

Почему?

Потому что оба aliases в итоге представляют `string`.

Conceptually:

```text
UserId
  ↓
string

OrderId
  ↓
string
```

Type alias **не создаёт новый runtime или nominal type**.

Поэтому:

```ts
type UserId = string;
```

полезен:

* для readability;
* для document intent;
* чтобы дать имя сложному type expression;

но сам по себе не предотвращает случайную передачу `OrderId` вместо `UserId`.

Если нужна подобная гарантия, используют отдельные patterns вроде branded types:

```ts
type UserId =
  string & { readonly __brand: "UserId" };
```

Это уже advanced technique.

---

## Intersections позволяют комбинировать types

```ts
type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};

type User = {
  id: string;
  name: string;
};

type StoredUser =
  User & Timestamped;
```

`StoredUser` должен удовлетворять обоим types:

```ts
const user: StoredUser = {
  id: "u-1",
  name: "Alex",
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

Mental model:

```text
A & B
→ значение должно удовлетворять A И B
```

Это отличается от union:

```text
A | B
→ A ИЛИ B
```

---

## Intersection — не то же самое, что object spread

Рассмотрим:

```ts
type A = {
  value: string;
};

type B = {
  value: number;
};

type C = A & B;
```

Это не означает:

> TypeScript выберет одно из свойств.

`C["value"]` должен одновременно удовлетворять:

```text
string AND number
```

Что фактически приводит к невозможному типу:

```ts
never
```

Поэтому intersections нужно воспринимать как **совмещение требований**, а не как JavaScript merge, где правое property может перезаписать левое.

Это важный нюанс при выборе между:

```ts
interface Child extends Parent
```

и:

```ts
type Child = Parent & Something
```

---

## Type aliases особенно сильны в type-level programming

Даже если пока не углубляться в advanced types, `type` является основным способом давать имена результатам type transformations.

Например:

```ts
type UserKeys = keyof User;
```

или:

```ts
type UserName = User["name"];
```

или позже:

```ts
type Nullable<T> =
  T | null;
```

Conditional types:

```ts
type Result<T> =
  T extends string
    ? StringResult
    : DefaultResult;
```

Mapped types:

```ts
type Optional<T> = {
  [K in keyof T]?: T[K];
};
```

То есть `type` используется не только для описания структуры данных, но и как фундамент TypeScript type-level programming.

---

## Type alias нельзя повторно открыть

```ts
type User = {
  id: string;
};

type User = {
  name: string;
};
```

Это ошибка.

В отличие от interface, type alias после объявления не участвует в declaration merging.

Для application code это иногда даже плюс:

> definition закрыт и не может неожиданно получить новые properties из другого declaration.

Для library augmentation — наоборот, interface может быть удобнее.

---

## Не создавай aliases без смысла

Такое:

```ts
type Name = string;
type Email = string;
type Title = string;
type Description = string;
```

может выглядеть выразительнее, но type system почти ничего от этого не получает.

Если `Email` остаётся обычным `string`, это в основном documentation.

Поэтому alias оправдан, когда он:

* представляет domain concept;
* убирает повторяющийся сложный type;
* делает API понятнее;
* участвует в type transformations.

Не обязательно давать имя каждому primitive.

---

## Вопросы на собеседовании

### Что такое type alias?

`type` создаёт имя для TypeScript type expression. Это может быть object type, union, tuple, function type, primitive alias, intersection или более сложный type-level expression.

### Создаёт ли `type UserId = string` новый отдельный тип?

Нет. Это alias для `string`, поэтому другой совместимый `string` можно присвоить `UserId`. Для nominal-like distinction нужны дополнительные patterns, например branded types.

### Чем intersection отличается от union?

`A | B` означает, что значение соответствует одному из вариантов. `A & B` требует соответствия обоим types одновременно.

### Можно ли объявить один type alias дважды, чтобы они объединились?

Нет. Type aliases не поддерживают declaration merging. Повторное объявление с тем же именем приведёт к ошибке.

### Почему `type` часто используется для advanced TypeScript?

Потому что он может именовать результат практически любого type expression: `keyof`, indexed access, mapped types, conditional types, unions, intersections и generic transformations.
