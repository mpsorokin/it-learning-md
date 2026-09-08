# 33. Function Overloads

Function overloads позволяют описать **несколько допустимых call signatures одной функции**, сохранив точную связь между аргументами и return type.

Например:

```ts
function findUser(id: string): User | null;
function findUser(ids: string[]): User[];

function findUser(
  input: string | string[]
): User | null | User[] {
  if (Array.isArray(input)) {
    return input.map(id => loadUser(id));
  }

  return loadUser(input);
}
```

Caller видит:

```ts
const user = findUser("u-1");
// User | null

const users = findUser(["u-1", "u-2"]);
// User[]
```

Главная ценность overloads не в том, что функция может принимать разные аргументы. Это можно сделать и union.

Ценность в том, что TypeScript сохраняет relationship:

```text
string
→ User | null

string[]
→ User[]
```

---

## Почему одного union иногда недостаточно

Можно написать:

```ts
function findUser(
  input: string | string[]
): User | null | User[] {
  // ...
}
```

Но тогда:

```ts
const user = findUser("u-1");
```

имеет слишком широкий тип:

```ts
User | null | User[]
```

Хотя runtime contract гораздо точнее.

Overloads позволяют описать его напрямую.

---

## Overload signatures и implementation signature — разные вещи

У функции есть:

```ts
function parse(value: string): number;
function parse(value: number): string;
```

Это **public overload signatures**.

А затем:

```ts
function parse(
  value: string | number
): string | number {
  return typeof value === "string"
    ? Number(value)
    : String(value);
}
```

Это **implementation signature**.

Caller её не видит как отдельный overload.

Например:

```ts
function createDate(timestamp: number): Date;
function createDate(
  year: number,
  month: number,
  day: number
): Date;

function createDate(
  a: number,
  b?: number,
  c?: number
): Date {
  if (b !== undefined && c !== undefined) {
    return new Date(a, b, c);
  }

  return new Date(a);
}
```

Разрешено:

```ts
createDate(1700000000000);
createDate(2026, 8, 10);
```

Но:

```ts
createDate(2026, 8);
```

ошибка.

Хотя implementation технически способна получить два arguments.

Почему?

Потому что public API состоит только из overload signatures.

```text
overloads
→ что разрешено caller-у

implementation signature
→ как мы реализуем все overloads
```

---

## Implementation должна покрывать все overloads

Плохо:

```ts
function convert(value: string): number;
function convert(value: number): string;

function convert(value: string): number {
  return Number(value);
}
```

Implementation не умеет обработать второй overload.

Правильно:

```ts
function convert(value: string): number;
function convert(value: number): string;

function convert(
  value: string | number
): string | number {
  return typeof value === "string"
    ? Number(value)
    : String(value);
}
```

Implementation обычно шире каждого отдельного overload-а.

---

## Когда union лучше overloads

Плохое использование overloads:

```ts
function log(value: string): void;
function log(value: number): void;

function log(
  value: string | number
): void {
  console.log(value);
}
```

Здесь caller ничего не выигрывает.

Оба variants:

```text
string → void
number → void
```

Поэтому проще:

```ts
function log(
  value: string | number
): void {
  console.log(value);
}
```

Правило:

> если input меняется, но output relationship не меняется — сначала рассматривай union.

---

## Когда generic лучше overloads

Плохо:

```ts
function identity(value: string): string;
function identity(value: number): number;
function identity(value: boolean): boolean;
```

Здесь мы вручную перечисляем одно общее правило:

```text
input type
=
output type
```

Generic описывает его напрямую:

```ts
function identity<T>(value: T): T {
  return value;
}
```

То есть:

```text
finite set of distinct call shapes
→ overloads

general reusable type relationship
→ generic
```

---

## Хороший реальный overload API

Например функция может работать в двух genuinely different modes:

```ts
function getConfig(
  key: "port"
): number;

function getConfig(
  key: "host"
): string;

function getConfig(
  key: "debug"
): boolean;

function getConfig(
  key: string
): unknown {
  return config[key];
}
```

Caller получает точный type:

```ts
const port = getConfig("port");
// number

const host = getConfig("host");
// string
```

Хотя для такого API при большом количестве keys уже лучше масштабируется generic:

```ts
function getConfig<
  K extends keyof AppConfig
>(
  key: K
): AppConfig[K] {
  return config[key];
}
```

Это хороший пример того, как overloads могут быть правильным решением сначала, но перестать масштабироваться при росте API.

---

## Order overloads может иметь значение

Например:

```ts
function parse(value: "json"): JsonResult;
function parse(value: string): unknown;
```

Более specific signature логично ставить раньше более general.

Если overload set состоит из большого количества пересекающихся signatures и developer должен разбираться в их приоритетах — API уже становится хрупким.

Хорошие overloads обычно:

* немногочисленны;
* различаются очевидно;
* дают caller-у заметно более точный type.

---

## Arrow function напрямую overload declarations не поддерживает

Для function declaration:

```ts
function convert(value: string): number;
function convert(value: number): string;
```

syntax естественный.

Для arrow можно описать overloaded call signature отдельно:

```ts
type Convert = {
  (value: string): number;
  (value: number): string;
};

const convert: Convert = (
  value: string | number
) => {
  return typeof value === "string"
    ? Number(value)
    : String(value);
};
```

Работает, но обычный `function` syntax для overload-heavy API чаще читается проще.

---

## Вопросы на собеседовании

### Когда стоит использовать function overloads?

Когда функция имеет небольшой набор разных call shapes и выбранная форма вызова определяет более точный return type. Если результат одинаковый для всех variants, union parameter обычно проще.

### Видит ли caller implementation signature?

Нет. Caller проверяется только против overload signatures. Implementation signature существует для реализации всех overloads.

### Когда generic лучше overloads?

Когда связь между input и output выражается общим правилом, например `T → T` или `K extends keyof T → T[K]`. Большое число похожих overloads часто говорит о том, что нужен generic.

### Может ли порядок overloads быть важен?

Да. Пересекающиеся signatures могут влиять на resolution, поэтому более specific overloads обычно располагают раньше более general.

---
