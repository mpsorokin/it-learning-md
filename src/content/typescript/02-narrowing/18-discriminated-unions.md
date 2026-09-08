# 18. Discriminated Unions

Discriminated union — это union object types, где каждый вариант имеет **общее property с разным literal value**.

Например:

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

Поле:

```ts
status
```

является discriminant.

Его literal value однозначно определяет variant.

```ts
function render(state: RequestState) {
  if (state.status === "success") {
    state.data;
    // state: success variant
  }
}
```

Это один из самых полезных TypeScript patterns для моделирования state.

---

## Почему это лучше набора optional fields

Рассмотрим плохую модель:

```ts
type RequestState = {
  loading: boolean;
  data?: User;
  error?: Error;
};
```

Она разрешает:

```ts
const state: RequestState = {
  loading: true,
  data: user,
  error: new Error(),
};
```

TypeScript не видит противоречия.

Мы сами создали model, где невозможное business state стало допустимым.

Discriminated union:

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

делает такие combinations невозможными.

Нельзя:

```ts
const state: RequestState = {
  status: "loading",
  data: user,
};
```

Потому что `loading` variant не содержит `data`.

Это очень сильный принцип:

> **Make impossible states unrepresentable.**

---

## Discriminant должен быть стабильным и явным

Хорошо:

```ts
type Payment =
  | {
      type: "card";
      cardNumber: string;
    }
  | {
      type: "bank";
      iban: string;
    };
```

Тогда:

```ts
function process(payment: Payment) {
  if (payment.type === "card") {
    payment.cardNumber;
  } else {
    payment.iban;
  }
}
```

Менее хорошо:

```ts
if ("cardNumber" in payment) {
  // считаем, что card
}
```

Это работает структурно, но discriminant:

```ts
type: "card"
```

лучше выражает domain meaning.

Сегодня оба variants могут отличаться по property.

Завтра property может появиться ещё у одного variant, и structural check станет менее очевидным.

---

## `switch` особенно естественен

```ts
function getPaymentLabel(
  payment: Payment
): string {
  switch (payment.type) {
    case "card":
      return `Card ${payment.cardNumber}`;

    case "bank":
      return `Bank ${payment.iban}`;
  }
}
```

В каждом `case` TypeScript знает точный variant.

Это особенно хорошо масштабируется на:

* reducers;
* domain events;
* workflow states;
* API results;
* command handlers.

---

## Реальный backend example: domain events

```ts
type UserEvent =
  | {
      type: "user.created";
      userId: string;
      email: string;
    }
  | {
      type: "user.deleted";
      userId: string;
    }
  | {
      type: "user.emailChanged";
      userId: string;
      email: string;
    };
```

Теперь consumer:

```ts
function handle(event: UserEvent) {
  switch (event.type) {
    case "user.created":
      sendWelcomeEmail(event.email);
      break;

    case "user.deleted":
      removeUserCache(event.userId);
      break;

    case "user.emailChanged":
      updateEmailIndex(
        event.userId,
        event.email
      );
      break;
  }
}
```

Каждая ветка получает только те fields, которые реально существуют для этого event.

Нам не нужно:

```ts
email?: string
```

на всех events.

---

## Не делай discriminant слишком широким

Плохо:

```ts
type Event = {
  type: string;
  payload: unknown;
};
```

Здесь:

```ts
event.type === "user.created"
```

не даёт TypeScript информации о `payload`.

Гораздо сильнее:

```ts
type Event =
  | {
      type: "user.created";
      payload: {
        id: string;
        email: string;
      };
    }
  | {
      type: "user.deleted";
      payload: {
        id: string;
      };
    };
```

Теперь связь:

```text
type
↓
конкретный payload
```

закодирована в type system.

---

## Не отделяй discriminant от связанных данных

Иногда API моделируют так:

```ts
type Result = {
  status: "success" | "error";
  data?: User;
  error?: Error;
};
```

Это **не полноценный discriminated union**.

TypeScript всё ещё допускает:

```ts
{
  status: "success",
  error: new Error()
}
```

Лучше:

```ts
type Result =
  | {
      status: "success";
      data: User;
    }
  | {
      status: "error";
      error: Error;
    };
```

Discriminated union работает именно потому, что каждый literal variant связан со своей структурой.

---

## Boolean тоже может быть discriminant

```ts
type Result =
  | {
      ok: true;
      data: User;
    }
  | {
      ok: false;
      error: Error;
    };
```

Использование:

```ts
if (result.ok) {
  result.data;
} else {
  result.error;
}
```

Это нормально для двух состояний.

Для более сложных state machines строковый discriminant обычно масштабируется лучше:

```ts
status:
  | "idle"
  | "loading"
  | "success"
  | "error"
```

---

## Не делай giant union без архитектурной причины

Технически можно:

```ts
type Event =
  | UserCreated
  | UserDeleted
  | OrderCreated
  | PaymentSucceeded
  | CacheInvalidated
  | EmailSent
  | ...
```

Но если один handler потом знает о 50 unrelated event types, проблема уже архитектурная.

Discriminated union хорошо моделирует **одну закрытую группу вариантов**.

Если группа перестаёт быть одной концепцией, её стоит разделить.

---

## Почему это senior-level tool, а не просто narrowing trick

Discriminated union полезен не потому, что позволяет удобно написать `switch`.

Он позволяет перенести business invariants в type system.

Вместо:

```text
"если status success, тогда data должна существовать"
```

как устной договорённости,

мы пишем:

```ts
type Result =
  | { status: "success"; data: User }
  | { status: "error"; error: Error };
```

Compiler начинает автоматически защищать invariant.

Это уже API/domain design.

---

## Вопросы на собеседовании

### Что такое discriminated union?

Это union object types, где каждый member содержит общий discriminant property с уникальным literal value. Проверка этого property позволяет TypeScript сузить значение до конкретного member.

### Почему discriminated union лучше набора optional properties?

Потому что он моделирует допустимые состояния отдельно и не позволяет создавать логически невозможные combinations полей.

### Что может быть discriminant?

Обычно string literal property вроде `type` или `status`. Также могут использоваться boolean или numeric literals, если они однозначно различают variants.

### Почему `type: string` не даёт нормального discriminated union?

Потому что широкий `string` не связывает конкретное значение с конкретной структурой. Нужны literal types вроде `"success"` и `"error"`.

### Где discriminated unions особенно полезны?

В state machines, reducers, API results, domain events, command models и любых closed sets вариантов, где разные states несут разные данные.
