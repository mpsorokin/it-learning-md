# Type Inference

Type inference — это способность TypeScript определить тип из уже доступной информации, без explicit annotation.

```ts
const count = 10;             // number
const environment = "prod";  // "prod"

function double(value: number) {
  return value * 2;           // return type: number
}
```

В локальном коде inference обычно предпочтительнее явных типов:

```ts
const users: User[] = await repository.find();
```

Если `repository.find()` уже возвращает `Promise<User[]>`, annotation ничего не добавляет:

```ts
const users = await repository.find();
```

Это важный принцип TypeScript: **явный тип полезен, когда он задаёт constraint или contract, а не когда просто повторяет то, что compiler уже знает.**

## Inference can widen types

TypeScript не всегда сохраняет максимально узкий literal type.

```ts
const status = "success";
// "success"

const response = {
  status: "success",
};
// response.status: string
```

`status` нельзя переназначить, поэтому `"success"` можно сохранить как literal type.

Но `response.status` остаётся mutable:

```ts
response.status = "error";
```

поэтому TypeScript выводит `string`.

Если нужны именно literal values:

```ts
const response = {
  status: "success",
} as const;

// readonly status: "success"
```

То есть inference учитывает не только текущее значение, но и то, **как значение может использоваться дальше**.

## Contextual typing

Inference может работать и в обратную сторону — тип приходит из контекста.

```ts
const numbers = [1, 2, 3];

numbers.map(value => value.toFixed(2));
//          ^ number
```

Мы не объявляли `value: number`.

TypeScript знает, что `numbers` — `number[]`, а `map()` ожидает callback, принимающий `number`. Поэтому parameter type выводится из signature `map()`.

То же самое постоянно происходит с:

* React event handlers;
* array callbacks;
* Promise callbacks;
* framework APIs.

## When should you write the type explicitly?

Для implementation details чаще оставляй inference:

```ts
const total = orders.reduce(
  (sum, order) => sum + order.price,
  0
);
```

Но explicit type полезен на важных boundaries:

```ts
function getUser(id: string): PublicUserDto {
  // ...
}
```

Здесь `PublicUserDto` нужен не потому, что TypeScript не способен вывести return type.

Он фиксирует **контракт функции**.

Если implementation случайно начнёт возвращать внутренние данные, compiler сможет это поймать.

Практическое правило:

```text
local implementation → prefer inference

public/domain boundary → consider explicit type
```

Не стоит пытаться аннотировать всё. Но и не стоит ожидать, что inference сам выразит архитектурное намерение разработчика.

## Interview questions

### What is type inference?

Type inference is TypeScript's ability to derive types from values and surrounding type information. I usually rely on it for local implementation details because explicit annotations would only duplicate information. I use explicit types when I want to establish a contract or architectural boundary.

### What is contextual typing?

Contextual typing means TypeScript can infer an expression's type from where that expression is used.

```ts
["a", "b"].map(value => value.toUpperCase());
//                  ^ string
```

The callback parameter is inferred from the `map()` signature.

### Should you always annotate function return types?

No. For internal functions, inferred return types usually reduce duplication. Explicit return types are more useful for exported APIs, domain boundaries, or anywhere you intentionally want to prevent implementation changes from silently changing the contract.
