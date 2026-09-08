# 11. `any`

`any` означает примерно следующее:

> **TypeScript, перестань проверять это значение. Я сам беру ответственность за его использование.**

```ts
let value: any = "hello";

value.toUpperCase();      // OK
value.doesNotExist();     // OK
value.foo.bar.baz();      // OK
```

Compiler практически перестаёт помогать.

Это принципиально отличается от обычного широкого типа. Например:

```ts
let value: string | number;
```

TypeScript всё ещё знает конечный набор вариантов и не позволит использовать операцию, которая небезопасна для одного из них.

С `any` эта информация потеряна.

---

## `any` — это escape hatch из type system

Рассмотрим:

```ts
function getConfig(): any {
  return loadConfig();
}

const config = getConfig();

config.database.connection.timeout.toFixed();
```

Весь expression проходит type checking, даже если реальный объект вообще не имеет:

```text
database
connection
timeout
```

То есть `any` не означает:

> здесь может быть любое значение.

Для этого есть `unknown`.

`any` означает:

> **не проверяй операции над этим значением.**

---

## Главная проблема `any` — он распространяется

```ts
const response: any = await legacyApi();

const user = response.user;
const address = user.address;
const city = address.city;
```

Что такое `city`?

Тоже `any`.

Ошибка на boundary начала распространяться дальше по application code.

Например:

```ts
function getUserName(user: any) {
  return user.profile.name;
}
```

Return type тоже фактически становится `any`.

Теперь другой код:

```ts
const name = getUserName(data);

name.toFixed(2);
```

TypeScript не остановит нас.

Поэтому один `any` в неправильном месте может создать **дыру в type safety намного дальше от исходной точки**.

Полезный mental model:

```text
any
↓
нет проверки
↓
результаты операций часто тоже any
↓
потеря type information распространяется
```

---

## `any` особенно опасен на внешних boundaries

Например мы получили JSON:

```ts
const data: any = await request();
```

И сразу:

```ts
const user: User = data.user;
```

Это выглядит типизированно:

```ts
user.name
user.email
```

но реальной гарантии нет.

Server вполне мог вернуть:

```json
{
  "user": null
}
```

или:

```json
{
  "user": {
    "username": 123
  }
}
```

`any` позволил внешним неподтверждённым данным пройти внутрь типизированной части приложения.

Для таких boundaries обычно безопаснее:

```ts
const data: unknown = await request();
```

а затем выполнить validation/narrowing.

---

## Explicit `any` и implicit `any`

Иногда `any` появляется неявно:

```ts
function log(value) {
  console.log(value);
}
```

Если compiler разрешает implicit `any`, параметр получает `any`.

В серьёзном TypeScript-проекте обычно включён:

```json
{
  "compilerOptions": {
    "noImplicitAny": true
  }
}
```

Тогда TypeScript заставит указать реальный контракт:

```ts
function log(value: string) {
  console.log(value);
}
```

или хотя бы сознательно написать:

```ts
function log(value: any) {
  console.log(value);
}
```

Это всё ещё небезопасно, но теперь решение явно принято разработчиком, а не появилось случайно.

---

## `any` уничтожает полезность union

Рассмотрим:

```ts
type Result = string | number | any;
```

Фактически наличие `any` делает весь type практически `any`.

Ведь если один member допускает вообще всё без проверки, ограничения остальных members больше мало что дают.

Поэтому конструкция вроде:

```ts
User | Error | any
```

почти наверняка является ошибкой дизайна.

---

## Когда `any` всё-таки допустим

Правило «`any` нельзя использовать никогда» слишком примитивное.

Есть реальные ситуации:

### 1. Миграция JavaScript → TypeScript

Большой legacy codebase невозможно всегда типизировать за один шаг.

```ts
const legacyModule: any = require("./legacy-module");
```

Здесь `any` может быть временным bridge.

Но желательно локализовать его:

```text
untyped world
      ↓
small adapter using any
      ↓
typed application
```

а не распространять `any` по всему проекту.

### 2. Сломанные или отсутствующие third-party typings

Иногда библиотека предоставляет runtime API, но нормальных типов нет.

`any` может быть pragmatic escape hatch до появления adapter/type declaration.

### 3. Некоторые type-level constraints

Можно встретить:

```ts
type AnyFunction =
  (...args: any[]) => any;
```

Здесь `any` используется не потому, что application data должна быть unsafe.

Смысл:

> здесь подходит function с произвольной signature.

Это другой use case, чем:

```ts
function createUser(data: any)
```

---

## `any` vs type assertion

Есть ещё один способ обойти compiler:

```ts
const user = value as User;
```

Это не `any`, но идея похожа: developer утверждает, что знает больше compiler-а.

Разница в масштабе.

Assertion:

```ts
value as User
```

обычно локально сообщает конкретный type.

`any`:

```ts
value: any
```

может позволить практически любые дальнейшие операции и распространяться дальше.

Поэтому `any` часто имеет больший blast radius.

---

## Практическое правило

Не спрашивай:

> Можно ли здесь использовать `any`?

Лучше спросить:

> **Где заканчивается unsafe zone?**

Хорошо:

```text
legacy/untrusted code
        ↓
small unsafe adapter
        ↓
validation/conversion
        ↓
typed application
```

Плохо:

```text
API response: any
        ↓
service: any
        ↓
repository: any
        ↓
controller: any
```

`any` полезен как локальный escape hatch. Он становится проблемой, когда превращается в способ проектирования application API.

---

## Вопросы на собеседовании

### Что такое `any`?

`any` позволяет фактически выйти из обычного TypeScript type checking для конкретного значения. Compiler разрешает property access, calls и другие операции без нормальной проверки их безопасности.

### Почему `any` опасен?

Главная проблема не только в одной небезопасной операции. Значения, полученные из `any`, часто тоже становятся `any`, поэтому потеря type information может распространяться по codebase.

### Есть ли допустимые случаи использования `any`?

Да. Например постепенная миграция legacy JavaScript, интеграция с плохо типизированной библиотекой или определённые low-level type constraints. Но `any` желательно локализовать на boundary и не позволять ему распространяться в domain/application code.

### Чем `any` отличается от `unknown`?

Оба могут содержать любое значение, но `any` позволяет сразу выполнять над ним практически любые операции. `unknown` заставляет сначала доказать compiler-у, с каким типом мы работаем.
