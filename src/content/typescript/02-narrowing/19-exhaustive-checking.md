# 19. Exhaustive Checking

Exhaustive checking — это проверка того, что код обработал **все возможные variants union**.

Например:

```ts
type Status =
  | "pending"
  | "paid"
  | "failed";
```

Обычный `switch`:

```ts
function getLabel(status: Status) {
  switch (status) {
    case "pending":
      return "Waiting";

    case "paid":
      return "Paid";

    case "failed":
      return "Failed";
  }
}
```

Пока variants три — всё нормально.

Но завтра добавили:

```ts
type Status =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";
```

Если compiler configuration и context не заставляют проверить completeness, старый `switch` легко забыть обновить.

Именно здесь нужен exhaustive checking.

---

## `never` используется как доказательство

После обработки всех вариантов value должен стать `never`.

```ts
function assertNever(
  value: never
): never {
  throw new Error(
    `Unexpected value: ${value}`
  );
}
```

Используем:

```ts
function getLabel(
  status: Status
): string {
  switch (status) {
    case "pending":
      return "Waiting";

    case "paid":
      return "Paid";

    case "failed":
      return "Failed";

    default:
      return assertNever(status);
  }
}
```

Если обработаны все variants:

```text
status in default
→ never
```

Теперь добавляем:

```ts
| "refunded"
```

но не обновляем `switch`.

В `default`:

```text
status
→ "refunded"
```

А `"refunded"` нельзя передать туда, где ожидается `never`.

Получаем compile-time error.

---

## Это особенно полезно с discriminated unions

```ts
type Payment =
  | {
      type: "card";
      amount: number;
    }
  | {
      type: "bank";
      amount: number;
      iban: string;
    }
  | {
      type: "wallet";
      amount: number;
      walletId: string;
    };
```

Handler:

```ts
function process(payment: Payment) {
  switch (payment.type) {
    case "card":
      return processCard(payment);

    case "bank":
      return processBank(payment);

    case "wallet":
      return processWallet(payment);

    default:
      return assertNever(payment);
  }
}
```

Теперь если появляется:

```ts
{
  type: "crypto";
  ...
}
```

старые handlers начинают падать **на compilation**, а не через месяц production bug-ом.

---

## Почему `default: throw new Error()` хуже

Можно написать:

```ts
default:
  throw new Error("Unknown status");
```

Runtime protection есть.

Но compile-time guarantee отсутствует.

После добавления нового variant compiler не обязан сказать:

> ты забыл обработать его.

Сравним:

```ts
default:
  throw new Error();
```

и:

```ts
default:
  return assertNever(status);
```

Второе кодирует assumption:

> сюда невозможно попасть, если type definition и handler синхронизированы.

---

## Inline `never` тоже нормально

Не обязательно иметь helper:

```ts
default: {
  const exhaustiveCheck: never = status;
  throw new Error(
    `Unhandled status: ${exhaustiveCheck}`
  );
}
```

Когда variant пропущен:

```ts
const exhaustiveCheck: never = status;
```

даёт compile-time error.

Helper просто удобнее переиспользовать.

---

## Exhaustiveness через return type

Иногда TypeScript может косвенно помочь и без `assertNever`.

Например:

```ts
function getLabel(
  status: Status
): string {
  switch (status) {
    case "pending":
      return "Waiting";

    case "paid":
      return "Paid";
  }
}
```

Если `failed` не обработан, function может не вернуть `string` на всех paths.

При строгих compiler settings можно получить ошибку.

Но `assertNever` обычно выражает intent гораздо точнее:

> union должен быть полностью исчерпан.

---

## `default` иногда скрывает новые variants

Рассмотрим:

```ts
function getLabel(status: Status) {
  switch (status) {
    case "pending":
      return "Waiting";

    case "paid":
      return "Paid";

    default:
      return "Unknown";
  }
}
```

Сегодня это кажется defensive programming.

Но завтра добавили:

```ts
"refunded"
```

и код молча вернёт:

```text
Unknown
```

Возможно, это не то, чего хотел бизнес.

Для **closed domain unions** generic `default` часто вреден, потому что скрывает необходимость обновить logic.

Если неизвестные runtime values действительно возможны, это уже другая boundary-задача: сначала нужно валидировать вход.

---

## Closed world vs open world

Exhaustive checking особенно хорошо работает, когда union представляет **закрытый набор состояний**, известный compile time.

Например:

```ts
type OrderStatus =
  | "draft"
  | "paid"
  | "shipped"
  | "cancelled";
```

Но если value приходит напрямую из uncontrolled external API:

```ts
const status: string =
  externalApi.status;
```

невозможно exhaustive-check все strings.

Нужно сначала преобразовать runtime input в trusted domain union:

```text
external string
      ↓
validation / mapping
      ↓
OrderStatus
      ↓
exhaustive business logic
```

Это сильный architecture pattern.

---

## Exhaustive checking помогает refactoring

Допустим, есть 15 places, которые обрабатывают:

```ts
PaymentMethod
```

Добавляем новый member:

```ts
"crypto"
```

Если handlers используют exhaustive checking, TypeScript фактически выдаёт список мест:

> здесь design assumption больше не выполняется.

Compiler становится инструментом impact analysis.

Это одна из самых практичных выгод сильной type model.

---

## Вопросы на собеседовании

### Что такое exhaustive checking?

Это compile-time проверка, что logic обработала все members union. Обычно она строится на том, что после исключения всех вариантов оставшееся значение должно иметь тип `never`.

### Почему для этого используется `never`?

Потому что `never` означает невозможное значение. Если в supposedly unreachable branch остаётся реальный union member, он не может быть assignable to `never`, и TypeScript выдаёт ошибку.

### Почему обычный `default` может быть хуже?

Он может молча обработать новый variant как generic fallback, и compiler не сообщит, что business logic устарела.

### Где exhaustive checking особенно полезен?

Для discriminated unions, state machines, reducers, domain events, statuses и других closed sets вариантов.

### Как exhaustive checking помогает при refactoring?

При добавлении нового union member compiler показывает все места, где старый набор вариантов считался полным и где теперь нужно обновить logic.
