# 6. Union Types

Union type означает:

> значение может принадлежать **одному из нескольких допустимых типов**.

```ts
type Id = string | number;

function loadUser(id: Id) {
  // ...
}
```

Caller может передать:

```ts
loadUser("u-123");
loadUser(123);
```

Но не:

```ts
loadUser(true);
// Error
```

Union — один из основных способов моделировать реальные альтернативные состояния в TypeScript.

---

## С union доступны только безопасные операции

Рассмотрим:

```ts
function printId(id: string | number) {
  id.toUpperCase();
}
```

Это ошибка.

Метод `toUpperCase()` существует только у `string`, а TypeScript в этой точке знает лишь:

```text
string OR number
```

Можно использовать только операции, безопасные для **всех членов union**.

Например:

```ts
function printId(id: string | number) {
  console.log(id.toString());
}
```

Или сначала сузить тип:

```ts
function printId(id: string | number) {
  if (typeof id === "string") {
    console.log(id.toUpperCase());
    return;
  }

  console.log(id.toFixed());
}
```

Именно поэтому unions тесно связаны с narrowing.

---

## Union лучше `any`, когда возможные варианты известны

Плохой вариант:

```ts
function normalize(value: any) {
  // ...
}
```

Такой параметр фактически отключает значительную часть type checking.

Если реально допустимы только два вида входа:

```ts
function normalize(
  value: string | string[]
) {
  return Array.isArray(value)
    ? value
    : [value];
}
```

Теперь API выражает реальный контракт:

```text
разрешено:
string
string[]

не разрешено:
number
object
boolean
что угодно ещё
```

Это не просто более «строгий синтаксис». Union сохраняет информацию, которую compiler затем может использовать для narrowing.

---

## Union — хороший способ моделировать состояние

Рассмотрим API request:

```ts
type RequestState = {
  loading: boolean;
  data?: User;
  error?: Error;
};
```

Этот type разрешает странные состояния:

```ts
const state: RequestState = {
  loading: true,
  data: user,
  error: new Error(),
};
```

Что означает одновременно:

* запрос идёт;
* данные уже есть;
* ошибка тоже есть.

TypeScript считает это валидным, потому что такой shape разрешён.

Гораздо точнее можно моделировать реальные варианты через union:

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

Теперь невозможные комбинации нельзя создать:

```ts
const state: RequestState = {
  status: "loading",
  data: user,
};
// Error
```

Это один из самых сильных практических use cases union types:

> моделировать допустимые состояния так, чтобы невозможные состояния нельзя было выразить.

---

## Union of objects требует правильного discriminant

Представим:

```ts
type UserResult = {
  user: User;
};

type ErrorResult = {
  error: Error;
};

type Result = UserResult | ErrorResult;
```

Работать можно:

```ts
function handle(result: Result) {
  if ("user" in result) {
    console.log(result.user.name);
  } else {
    console.error(result.error);
  }
}
```

Но часто лучше иметь явное поле:

```ts
type Result =
  | {
      type: "success";
      user: User;
    }
  | {
      type: "error";
      error: Error;
    };
```

Теперь narrowing становится проще и API понятнее:

```ts
function handle(result: Result) {
  if (result.type === "success") {
    console.log(result.user.name);
  } else {
    console.error(result.error);
  }
}
```

Это уже discriminated union — отдельная тема позже.

---

## Не каждый union означает хороший дизайн

Можно написать:

```ts
type Input =
  | string
  | number
  | boolean
  | User
  | Order
  | null;
```

Но если функция затем выглядит так:

```ts
function handle(input: Input) {
  if (typeof input === "string") {
    // ...
  } else if (typeof input === "number") {
    // ...
  } else if (...) {
    // ...
  }
}
```

возможно, проблема не в TypeScript, а в API.

Большой unrelated union часто означает:

> одна функция пытается делать слишком много разных вещей.

Union полезен, когда варианты действительно принадлежат **одной концепции**.

Например:

```ts
type PaymentMethod =
  | CardPayment
  | BankTransfer
  | WalletPayment;
```

Это логичная группа.

А:

```ts
string | User | Order | boolean
```

может быть просто type-system способом спрятать плохую abstraction.

---

## Union parameter vs overloads

Рассмотрим:

```ts
function print(value: string | number): void {
  console.log(value);
}
```

Union здесь идеален:

```text
string → void
number → void
```

Return type одинаковый.

Но если результат зависит от input:

```ts
string → User
string[] → User[]
```

union может потерять связь:

```ts
function findUser(
  input: string | string[]
): User | User[] {
  // ...
}
```

Caller получает:

```ts
const result = findUser("123");
// User | User[]
```

Хотя мы знаем, что при `string` должен вернуться `User`.

В таких случаях overloads или generic relationship могут дать более точный API.

То есть union — не универсальная замена overloads.

---

## Union автоматически упрощается

Например:

```ts
type A = string | never;
// string
```

`never` означает невозможное значение, поэтому ничего не добавляет union.

И:

```ts
type B =
  | "admin"
  | "user"
  | "admin";
```

дубликаты тоже не имеют смысла.

Conceptually type system работает с множествами допустимых значений:

```text
string | number
=
все strings
+
все numbers
```

Такое представление помогает понимать многие более advanced темы TypeScript.

---

## Вопросы на собеседовании

### Что такое union type?

Union описывает значение, которое может соответствовать одному из нескольких типов. Пока TypeScript не знает конкретный вариант, разрешены только операции, безопасные для всех членов union.

### Почему union безопаснее `any`?

Потому что union сохраняет конечный набор возможных типов. TypeScript может проверять операции и затем сужать тип. `any` в значительной степени отключает эту проверку.

### Когда union особенно полезен?

Когда domain concept имеет несколько реальных альтернативных состояний: например success/error, разные payment methods или разные виды событий. Особенно хорошо union работает вместе с discriminant field.

### Когда union может быть признаком плохого API?

Когда он объединяет большое количество несвязанных типов и implementation вынуждена иметь длинную цепочку проверок. Это может означать, что одна функция объединяет несколько разных responsibilities.

### Когда overload лучше union parameter?

Когда конкретная форма input определяет конкретный output и caller должен сохранить эту связь. Union parameter может превратить точный результат в слишком широкий union.
