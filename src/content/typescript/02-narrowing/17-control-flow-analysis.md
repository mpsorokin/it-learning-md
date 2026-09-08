# 17. Control-flow Analysis

Control-flow analysis — это механизм, с помощью которого TypeScript отслеживает, **какие типы реально возможны в конкретной точке программы**.

То есть declared type переменной может быть широким:

```ts
function print(value: string | number | null) {
  // value: string | number | null
}
```

но после проверок TypeScript постепенно сужает его.

```ts
function print(value: string | number | null) {
  if (value === null) {
    return;
  }

  // value: string | number

  if (typeof value === "string") {
    console.log(value.toUpperCase());
    return;
  }

  // value: number
  console.log(value.toFixed(2));
}
```

Главная идея:

```text
declared type
      ↓
runtime checks
      ↓
reachable branches
      ↓
current narrowed type
```

TypeScript анализирует не отдельный `if`, а весь flow функции.

---

## Early return меняет тип ниже по коду

Очень частый pattern:

```ts
function process(user: User | null) {
  if (!user) {
    return;
  }

  user.name;
  user.email;
}
```

После:

```ts
if (!user) return;
```

ветка `null` больше не может достичь оставшейся части функции.

Поэтому ниже:

```ts
user: User
```

Это одна из причин, почему guard clauses часто хорошо сочетаются с TypeScript.

Вместо:

```ts
function process(user: User | null) {
  if (user) {
    // много вложенного кода
  }
}
```

можно:

```ts
function process(user: User | null) {
  if (!user) return;

  // дальше User
}
```

Это одновременно уменьшает nesting и упрощает reasoning type checker-а.

---

## Narrowing не меняет declared type навсегда

```ts
let value: string | number = "hello";

if (typeof value === "string") {
  value.toUpperCase();

  value = 123;

  value.toFixed();
}
```

До assignment:

```text
value: string
```

После:

```ts
value = 123;
```

TypeScript знает:

```text
value: number
```

Но declared type переменной всё ещё:

```ts
string | number
```

Поэтому позже можно снова сделать:

```ts
value = "world";
```

Нужно различать:

```text
declared type
→ что переменной вообще разрешено содержать

narrowed type
→ что compiler знает о ней здесь и сейчас
```

---

## TypeScript анализирует присваивания

Например:

```ts
let result: string | number;

result = "done";

result.toUpperCase();
```

Хотя declared type:

```ts
string | number
```

после присваивания compiler знает, что текущее значение — `string`.

То же работает через branches:

```ts
let result: string | number;

if (Math.random() > 0.5) {
  result = "done";
} else {
  result = 42;
}

// result: string | number
```

После объединения веток TypeScript снова должен учитывать оба варианта.

Это важная часть control-flow analysis: compiler анализирует не только guards, но и **assignment history**.

---

## Reachability помогает исключать варианты

```ts
function normalize(
  value: string | number
): string {
  if (typeof value === "string") {
    return value;
  }

  return value.toString();
}
```

После первого `return` TypeScript понимает:

> если execution дошёл сюда, `value` уже не может быть `string`.

Поэтому во второй ветке:

```ts
value: number
```

Это работает и с `throw`:

```ts
function requireUser(
  user: User | null
): User {
  if (!user) {
    throw new Error("User required");
  }

  return user;
}
```

После `throw` null-case становится unreachable.

---

## Narrowing может работать через несколько условий

```ts
function handle(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string"
  ) {
    value.name.toUpperCase();
  }
}
```

TypeScript последовательно накапливает знания:

```text
unknown
↓
object | null
↓
object
↓
object with "name"
↓
name: string
```

Это не четыре независимые проверки. Вместе они образуют доказательство.

---

## Aliases тоже могут участвовать в narrowing

```ts
function process(
  value: string | number
) {
  const isString =
    typeof value === "string";

  if (isString) {
    value.toUpperCase();
  }
}
```

TypeScript может понимать, что `isString === true` означает соответствующее narrowing `value`.

Это делает код удобнее, когда условие имеет смысловое имя:

```ts
const isAuthenticated =
  user !== null &&
  user.session !== null;

if (isAuthenticated) {
  // ...
}
```

Но чем сложнее mutation и aliases, тем сложнее сохранить narrowing.

---

## Mutation может инвалидировать предыдущие гарантии

Представим:

```ts
type User = {
  profile?: {
    name: string;
  };
};

function process(user: User) {
  if (user.profile) {
    user.profile.name.toUpperCase();
  }
}
```

В простом синхронном flow всё понятно.

Но если между проверкой и использованием происходит mutation:

```ts
if (user.profile) {
  user.profile = undefined;

  user.profile.name;
}
```

TypeScript справедливо больше не может считать property существующим.

Senior-level идея здесь важнее конкретной ошибки:

> narrowing — это доказательство, действительное только пока assumptions остаются true.

---

## Callbacks могут усложнять reasoning

```ts
function process(user: User | null) {
  if (!user) return;

  items.forEach(() => {
    console.log(user.name);
  });
}
```

Во многих случаях narrowing сохраняется, если variable не мутируется.

Но с mutable outer state, callbacks и asynchronous code compiler иногда должен быть осторожнее.

Например:

```ts
let user: User | null = getUser();

if (user) {
  setTimeout(() => {
    // между проверкой и выполнением callback
    // user теоретически мог измениться
  });
}
```

Практический вывод:

> чем больше mutable shared state между guard и использованием, тем слабее локальные guarantees.

Это уже не только TypeScript-проблема, а общий вопрос design-а.

---

## Control-flow analysis — основа narrowing

`typeof`, `in`, `instanceof`, discriminated unions, user-defined type guards — это не отдельные несвязанные features.

Все они поставляют compiler-у информацию для одной системы:

```text
runtime condition
      ↓
control-flow graph
      ↓
possible types
      ↓
narrowed type
```

Поэтому понимание control-flow analysis важнее заучивания отдельных guards.

---

## Вопросы на собеседовании

### Что такое control-flow analysis в TypeScript?

Это анализ reachable paths программы, assignments и runtime-проверок, на основе которого TypeScript определяет более узкий тип значения в конкретной точке кода.

### Меняет ли narrowing declared type переменной?

Нет. Declared type задаёт все значения, которые переменная может принимать. Narrowing меняет только текущий тип, известный compiler-у в конкретной control-flow branch.

### Почему early return помогает narrowing?

Потому что после `return` соответствующий вариант больше не может достичь следующего участка кода. TypeScript исключает его из множества возможных типов.

### Может ли assignment отменить narrowing?

Да. Если после проверки значение изменилось, TypeScript пересчитывает тип с учётом нового assignment.

### Почему narrowing особенно хорошо работает с guard clauses?

Guard clause быстро исключает invalid case и позволяет остальной части функции работать уже с более точным типом без дополнительного nesting.
