# Практика: type utilities

## Interview questions

### Написать:
<!-- question-id: fullstack-interview-03-typescript-core-041 -->

```ts
getProperty(obj, key)
```

так, чтобы неправильный key был compile-time error.

Дальше:

#### Ответ

Используйте generic по объекту и ключу: связь между key и результатом сохраняется как T[K], поэтому key не расширяется до произвольной строки.

```ts
function getProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K,
): T[K] {
  return obj[key];
}

const user = { id: 42, name: "Ada" };
const id = getProperty(user, "id"); // number
// getProperty(user, "email"); // compile-time error
```

Ограничение object исключает null и примитивы, но массив и функция также являются object; если контракт должен быть только plain object, это отдельная runtime-проверка. Для dictionary с index signature допустимые ключи закономерно шире. Включите strict и noUncheckedIndexedAccess, чтобы чтение индексной сигнатуры могло отражать undefined.

### DeepPartial&lt;T&gt;
<!-- question-id: fullstack-interview-03-typescript-core-042 -->

#### Ответ

Один практичный вариант рекурсивно делает optional свойства, но сохраняет атомарные значения, функции, коллекции и tuple-модификаторы. Что считать атомарным — политика конкретного домена: Date, branded types, классы, Map/Set требуют явного решения.

```ts
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type DeepPartial<T> =
  T extends Primitive | Date | RegExp ? T :
  T extends (...args: never[]) => unknown ? T :
  T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<K, DeepPartial<V>> :
  T extends ReadonlySet<infer V> ? ReadonlySet<DeepPartial<V>> :
  T extends readonly unknown[] ? { [K in keyof T]?: DeepPartial<T[K]> } :
  T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } :
  T;
```

Проверка массивов перед object важна, иначе массив станет mapped-объектом методов и индексов; mapped tuple сохраняет tuple-форму и readonly. Функции исключены через callable signature, иначе их поля исказятся. Это тип patch-данных, а не готовая операция deep merge: поведение для удаления, null и массивов нужно определить отдельно, а runtime-ввод всё равно валидировать.

### DeepReadonly&lt;T&gt;
<!-- question-id: fullstack-interview-03-typescript-core-043 -->

#### Ответ

Рекурсивный readonly должен сохранять форму tuple/array и не превращать Date/функции в структуры их методов. Ниже Map/Set экспонируются через read-only интерфейсы; если API должен защищать только собственные поля объекта, уберите эту ветвь либо адаптируйте под домен.

```ts
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type DeepReadonly<T> =
  T extends Primitive | Date | RegExp ? T :
  T extends (...args: never[]) => unknown ? T :
  T extends ReadonlyMap<infer K, infer V> ?
    ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>> :
  T extends ReadonlySet<infer V> ? ReadonlySet<DeepReadonly<V>> :
  T extends readonly unknown[] ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;
```

ReadonlyMap/ReadonlySet скрывают mutating methods на этой ссылке, но другой alias исходного Map всё ещё может менять его. Date оставлен атомарным, хотя setTime мутирует объект: это показывает, что типовая глубокая иммутабельность не равна runtime-заморозке. Для доменных классов задайте whitelist atomic types. Рекурсивные условные типы также имеют предел сложности компилятора.

### Nullable&lt;T&gt;
<!-- question-id: fullstack-interview-03-typescript-core-044 -->

#### Ответ

Если смысл — «значение типа T либо явно null», достаточно:

```ts
type Nullable<T> = T | null;

type UserName = Nullable<string>; // string | null
```

Это отличается от optional-поля (его можно не передать), от undefined и от mapped-типа, делающего поля объекта nullable. Для последнего потребовалось бы отдельное имя вроде NullableFields<T> = { [K in keyof T]: T[K] | null }. Выбирайте одну семантику и используйте её последовательно в API/БД; TypeScript alias ничего не преобразует и не валидирует вход.

### PickByValue&lt;T, V&gt;
<!-- question-id: fullstack-interview-03-typescript-core-045 -->

#### Ответ

Фильтрация ключей через conditional type оставляет свойства, типы которых assignable к V целиком:

```ts
type PickByValue<T, V> = Pick<
  T,
  { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T]
>;

type Model = { id: number; name: string; nickname?: string };
type Strings = PickByValue<Model, string>; // { name: string }
```

Модификатор -? нужен, чтобы optional-модификатор промежуточных mapped properties не добавил undefined в union ключей. Optional nickname имеет тип string | undefined, поэтому при строгом режиме не проходит как целиком string. Если задумка — выбрать поля, чьё non-nullish значение соответствует V, условие можно заменить на NonNullable<T[K]> extends V; если достаточно любого пересечения — на Extract<T[K], V> вместо extends. Эти три семантики различаются.

### strongly typed event emitter
<!-- question-id: fullstack-interview-03-typescript-core-046 -->

#### Ответ

Опишите event map как соответствие имени события типу payload и связывайте имя и данные одним generic K:

```ts
type Listener<T> = (payload: T) => void;
class TypedEmitter<E extends object> {
  private readonly listeners = new Map<keyof E, Set<unknown>>();

  on<K extends keyof E>(event: K, listener: Listener<E[K]>): () => void {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set<unknown>();
      this.listeners.set(event, bucket);
    }
    bucket.add(listener);
    return () => bucket.delete(listener);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const bucket = this.listeners.get(event);
    bucket?.forEach(listener => (listener as Listener<E[K]>)(payload));
  }
}

type AppEvents = {
  "user.created": { id: string; email: string };
  "cache.cleared": { keys: readonly string[] };
  "__proto__": { source: string };
  constructor: { source: string };
  toString: { count: number };
};

const events = new TypedEmitter<AppEvents>();
events.emit("user.created", { id: "u1", email: "a@example.com" });
// events.emit("user.created", { keys: [] }); // compile-time error
events.on("__proto__", payload => console.log(payload.source));
events.on("constructor", payload => console.log(payload.source));
events.on("toString", payload => console.log(payload.count));
events.emit("__proto__", { source: "safe" });
events.emit("constructor", { source: "safe" });
events.emit("toString", { count: 1 });
```

`Map` хранит ключи без преобразования и не наследует `constructor`, `toString` или `__proto__` из `Object.prototype`; строковые, числовые и symbol-ключи также не смешиваются. Внутренний cast локализован на чтении: TypeScript не сохраняет корреляцию между dynamic key и типом listener-а внутри общей Map, тогда как публичные `on`/`emit` остаются типизированными. Пример специально проверяет имена, проблемные для обычного `{}`-словаря. Production-версия должна определить snapshot-семантику при добавлении/удалении listener во время emit, обработку исключения listener-а, порядок вызова и утечку подписки. Возвращённый unsubscribe упрощает освобождение ресурса.

### strongly typed API response
<!-- question-id: fullstack-interview-03-typescript-core-047 -->

#### Ответ

Объедините успех и ошибку в discriminated union. Тогда компилятор связывает data и error с правильной веткой:

```ts
type ApiResponse<T, E = { code: string; message: string }> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: E };

function matchResponse<T, E, R>(
  response: ApiResponse<T, E>,
  handlers: {
    success: (data: T, status: number) => R;
    failure: (error: E, status: number) => R;
  },
): R {
  if (response.ok) return handlers.success(response.data, response.status);
  return handlers.failure(response.error, response.status);
}
```

status может быть HTTP status; transport failure лучше моделировать отдельно, если ответ вообще не пришёл. Тип не подтверждает payload сервера: JSON.parse возвращает недоверенное значение, его нужно разобрать как unknown и проверить runtime-схемой до создания ApiResponse<T>. Не превращайте все ошибки в один string, если вызывающему нужны retryability, validation details или машинно-читаемый code.

### discriminated union для async state
<!-- question-id: fullstack-interview-03-typescript-core-048 -->

#### Ответ

Используйте одно поле kind и отдельные payload только для состояний, которым они нужны. Это исключает противоречивые комбинации isLoading/isError/data:

```ts
type AsyncState<T, E = Error> =
  | { status: "idle" }
  | { status: "loading"; requestId: string }
  | { status: "success"; data: T; updatedAt: number }
  | { status: "error"; error: E; retryable: boolean };

function render<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "idle": return "Start";
    case "loading": return `Loading ${state.requestId}`;
    case "success": return "Ready";
    case "error": return state.error.message;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
```

Реальный UI иногда сохраняет предыдущие данные во время revalidation или ошибочного обновления; тогда явно моделируйте такую комбинацию (например, success с refresh: loading | error), а не добавляйте независимые флаги бесконтрольно. Discriminant обеспечивает compile-time исчерпывающий switch, но переходы состояний и гонки запросов всё ещё нужно контролировать в runtime, например requestId/version.
