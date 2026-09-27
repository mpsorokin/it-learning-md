# Практика: advanced types

## Interview questions

### реализовать Awaited<T>;
<!-- question-id: fullstack-interview-04-typescript-advanced-027 -->

#### Ответ

Условный тип извлекает аргумент thenable и рекурсивно раскрывает вложенные Promise/thenable; обычное значение остаётся без изменений:

```ts
type MyAwaited<T> =
  T extends null | undefined ? T :
  T extends object & { then(onfulfilled: infer F, ...args: any[]): any } ?
    F extends (value: infer V, ...args: any[]) => any ?
      MyAwaited<V> :
      never :
    T;

type A = MyAwaited<Promise<Promise<string>>>; // string
type B = MyAwaited<string | Promise<number>>; // string | number
```

Условие с naked T распределяется по union. Эта версия иллюстрирует контракт, но стандартный Awaited сложнее, чтобы учитывать разнообразные thenable signatures и ошибки в then. Не называйте алиас Awaited в проекте, где он уже включён в lib; utility встроен в TS 4.5+. Это вычисление типа, оно не выполняет runtime await.

### реализовать ReturnType<T>;
<!-- question-id: fullstack-interview-04-typescript-advanced-028 -->

#### Ответ

infer помещает тип результата из callable signature в локальный параметр R:

```ts
type MyReturnType<T> =
  T extends (...args: any[]) => infer R ? R : never;

type Result = MyReturnType<(id: string) => Promise<{ id: string }>>;
// Promise<{ id: string }>
```

any[] здесь используется как общий шаблон аргументов, чтобы матчить функции с разной arity; utility ничего не вызывает и не валидирует. Для не-функции выбран never как явная политика (стандартный ReturnType требует callable constraint у T и не используется с произвольным типом). У overload берётся последняя публичная сигнатура, поскольку TS не выполняет overload resolution для данного типа без конкретных аргументов.

### tuple → union;
<!-- question-id: fullstack-interview-04-typescript-advanced-029 -->

#### Ответ

Числовой indexed access выбирает типы всех элементов tuple/array. Ограничение readonly unknown[] принимает как mutable, так и readonly tuples:

```ts
type TupleToUnion<T extends readonly unknown[]> = T[number];

type Status = TupleToUnion<readonly ["idle", "loading", "done"]>;
// "idle" | "loading" | "done"
```

Для обычного массива T[number] будет типом его элемента; для пустого tuple — never. Имена tuple-параметров полезны для документации, но не меняют результат. Это статическая операция: никакой runtime union не создаётся.

### union → intersection;
<!-- question-id: fullstack-interview-04-typescript-advanced-030 -->

#### Ответ

Дистрибутивный conditional сначала превращает каждого участника union в функцию-потребителя, затем inference в контравариантной позиции объединяет кандидатов как intersection:

```ts
type UnionToIntersection<U> =
  (U extends unknown ? (value: U) => void : never) extends
    (value: infer I) => void ? I : never;

type Combined = UnionToIntersection<{ id: string } | { active: boolean }>;
// { id: string } & { active: boolean }
```

Это advanced type-level idiom, опирающийся на distributivity и inference из параметра функции; он менее прозрачен, чем intersections, если его вставить без обоснования. Для never результат остаётся never, а any имеет особые эффекты. Не трактуйте его как runtime-merge объектов: runtime-данные всё ещё нужно объединить отдельно и проверить конфликты полей.

### typed object paths;
<!-- question-id: fullstack-interview-04-typescript-advanced-031 -->

#### Ответ

Ниже — dot-path для plain objects: массивы, функции и встроенные объекты считаются листьями; числовые индексы массива специально не входят в контракт.

```ts
type Atomic = string | number | boolean | bigint | symbol | null | undefined | Date;
type Paths<T> = T extends Atomic | readonly unknown[] | ((...args: never[]) => unknown)
  ? never
  : {
      [K in keyof T & string]:
        NonNullable<T[K]> extends Atomic | readonly unknown[] | ((...args: never[]) => unknown)
          ? K
          : K | `${K}.${Paths<NonNullable<T[K]>>}`
    }[keyof T & string];

type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? PathValue<NonNullable<T[K]>, Rest> | Extract<T[K], null | undefined>
      : never
    : P extends keyof T ? T[P] : never;

type Profile = { user?: { id: string; settings: { theme: "dark" | "light" } } };
type ProfilePath = Paths<Profile>; // "user" | "user.id" | "user.settings" | "user.settings.theme"
type Theme = PathValue<Profile, "user.settings.theme">; // "dark" | "light" | undefined
```

Здесь recursive conditional разворачивает конечную структуру, optional parent отражён в PathValue как undefined. Для неизвестного индекса/циклического типа нужна другая модель и, возможно, ограничение глубины, иначе union путей резко растёт. Такой тип проверяет только литеральный путь; он не читает значение и не проверяет внешний объект. Runtime getPath обязан безопасно обрабатывать nullish промежуточные сегменты.

### type-safe event map;
<!-- question-id: fullstack-interview-04-typescript-advanced-032 -->

#### Ответ

Удобная модель — event name → tuple аргументов; так тип события и параметры emit связаны, включая несколько аргументов:

```ts
type Handler<Args extends readonly unknown[]> = (...args: Args) => void;

class EventBus<E extends { [K in keyof E]: readonly unknown[] }> {
  private readonly handlers = new Map<keyof E, Set<unknown>>();

  on<K extends keyof E>(name: K, handler: Handler<E[K]>): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set<unknown>();
      this.handlers.set(name, set);
    }
    set.add(handler);
    return () => set.delete(handler);
  }

  emit<K extends keyof E>(name: K, ...args: E[K]): void {
    const set = this.handlers.get(name);
    set?.forEach(handler => (handler as Handler<E[K]>)(...args));
  }
}

type Events = {
  connected: [userId: string];
  failed: [code: number, message: string];
  "__proto__": [source: string];
  constructor: [];
  toString: [count: number];
};

const bus = new EventBus<Events>();
bus.emit("connected", "u-42");
bus.emit("failed", 500, "Unavailable");
// bus.emit("connected", 42); // compile-time error
bus.on("__proto__", source => console.log(source));
bus.on("constructor", () => console.log("constructor event"));
bus.on("toString", count => console.log(count));
bus.emit("__proto__", "safe");
bus.emit("constructor");
bus.emit("toString", 1);
```

`Map` сохраняет event name как отдельный ключ и не сталкивается с унаследованными свойствами объекта; примеры `__proto__`, `constructor` и `toString` проверяют этот крайний случай. Внутренний cast локализован на чтении: TypeScript не сохраняет корреляцию между dynamic key и типом handler-а внутри общей Map, но публичный интерфейс сохраняет точную связь K → E[K]. Runtime-дизайн должен отдельно зафиксировать порядок обработчиков, поведение при исключении, изменения подписок во время emit и cleanup.

### type-safe route params;
<!-- question-id: fullstack-interview-04-typescript-advanced-033 -->

#### Ответ

Для маршрутов с сегментами вида :name можно извлечь названия параметров рекурсией по slash и построить объект обязательных string-значений:

```ts
type SegmentParam<S extends string> = S extends `:${infer Name}` ? Name : never;
type ParamNames<Path extends string> =
  Path extends `${infer Head}/${infer Rest}`
    ? SegmentParam<Head> | ParamNames<Rest>
    : SegmentParam<Path>;
type RouteParams<Path extends string> = { [K in ParamNames<Path>]: string };

function buildPath<const Path extends string>(
  pattern: Path,
  params: RouteParams<Path>,
): string {
  return pattern.split("/").map(segment => {
    if (!segment.startsWith(":")) return segment;
    const key = segment.slice(1);
    const value = (params as unknown as Record<string, string>)[key];
    if (value === undefined) throw new Error(`Missing route parameter: ${key}`);
    return encodeURIComponent(value);
  }).join("/");
}

buildPath("/users/:userId/posts/:postId", { userId: "u 1", postId: "p2" });
// buildPath("/users/:userId", { postId: "p2" }); // compile-time error
```

Контракт сознательно поддерживает только обязательные параметры в сегментах, не query/hash, wildcard, optional segments или ограничения формата. Dynamic route из string теряет литеральную структуру, поэтому для него нужен parser и runtime-валидация. encodeURIComponent защищает структуру URL от разделителей, но не заменяет авторизацию и проверку бизнес-значения.

### типизировать builder API.
<!-- question-id: fullstack-interview-04-typescript-advanced-034 -->

#### Ответ

Builder может кодировать обязательные этапы в generic state: до получения url и method метод build имеет тип never, после обоих вызовов возвращает готовый контракт.

```ts
type Method = "GET" | "POST";
type Request = { url: string; method: Method; timeout?: number };
type Ready = Pick<Request, "url" | "method">;

type RequestBuilder<S extends Partial<Request>> = {
  setUrl(url: string): RequestBuilder<S & { url: string }>;
  setMethod(method: Method): RequestBuilder<S & { method: Method }>;
  build: S extends Ready ? () => Readonly<S & Request> : never;
};

function requestBuilder<S extends Partial<Request> = {}>(
  state = {} as S,
): RequestBuilder<S> {
  const api = {
    setUrl(url: string) {
      return requestBuilder({ ...state, url });
    },
    setMethod(method: Method) {
      return requestBuilder({ ...state, method });
    },
    build() {
      if (state.url === undefined || state.method === undefined) {
        throw new Error("url and method are required");
      }
      return Object.freeze({ ...state }) as unknown as Readonly<S & Request>;
    },
  };
  return api as unknown as RequestBuilder<S>;
}

const request = requestBuilder()
  .setUrl("/users")
  .setMethod("GET")
  .build();
```

Приведение локализовано в factory: TypeScript не выводит изменение generic state через динамическую реализацию объекта, поэтому type-level promise проверяется интерфейсом вызова. Runtime guard всё равно нужен для JS callers, any и ошибочной десериализации. Object.freeze здесь только поверхностный; сложное состояние требует решения о владении, immutable data и семантике повторной установки поля. Добавляйте необходимые этапы в Ready, а опциональные настройки не включайте туда.
