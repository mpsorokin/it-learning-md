# Utility types: работа с функциями и nullable

## Interview questions

### Extract.
<!-- question-id: fullstack-interview-03-typescript-core-036 -->

#### Ответ

Extract<T, U> оставляет из union T только варианты, assignable к U. Это парный к Exclude условный тип: Extract<"get" | "post" | 42, string> даёт "get" | "post". Из-за distributivity он фильтрует участников, а не ищет пересечение частей произвольных типов; например, из широкого string нельзя получить отдельный литерал "get". Полезен для выбора подтипов discriminated union, например Extract<Action, { kind: "save" }>. Результат — только тип, он не фильтрует значение в runtime.

### ReturnType.
<!-- question-id: fullstack-interview-03-typescript-core-037 -->

#### Ответ

ReturnType<F> извлекает объявленный возвращаемый тип callable типа F с помощью условного типа и infer. Для function getUser(): Promise<User> результат — Promise<User>, не User и не результат await; для неизвестного callable обычно получается unknown в современном TS. Для generic-функций тип часто теряет зависимость от конкретного параметра и отражает результат как instantiated/constraint-подобный тип; у overloaded function извлекается результат последней сигнатуры overload list. Это не запускает функцию и не исследует реальный runtime return. Используйте для производных деклараций, но сохраняйте отдельный именованный контракт, если публичная семантика должна быть стабильной.

### Parameters.
<!-- question-id: fullstack-interview-03-typescript-core-038 -->

#### Ответ

Parameters<F> возвращает tuple типов аргументов функции F: Parameters<(id: string, force?: boolean) => User> будет [id: string, force?: boolean]. Tuple сохраняет порядок, optional/rest-параметры и метки параметров для tooling, что удобно для wrapper-ов и типизированного forwarding (...args: Parameters<F>). Для generic-функции параметры часто обобщаются до constraint/unknown-формы, а у перегрузок utility использует последнюю сигнатуру, поэтому не следует ожидать union всех вызовов. Это типовая операция: для реального проксирования всё ещё нужно вызвать исходную функцию с аргументами и сохранить this-контекст, если он участвует в сигнатуре.

### Awaited.
<!-- question-id: fullstack-interview-03-typescript-core-039 -->

#### Ответ

Awaited<T> моделирует рекурсивное семантическое разыменование await: для Promise<Promise<User>> это User; thenable с корректной then-сигнатурой тоже может разыменоваться, а union обрабатывается по членам. Тип появился как standard utility в TypeScript 4.5 ([release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html)), поэтому для более старого target/toolchain нужна своя совместимая декларация или обновление TS. Awaited не выполняет await и не проверяет объект в runtime — это вычисление типа. В собственных обобщённых API обычно полезно указывать Promise<Awaited<T>> или возвращаемый тип, который отражает фактическое flatten-поведение функции.

### NonNullable.
<!-- question-id: fullstack-interview-03-typescript-core-040 -->

#### Ответ

NonNullable<T> удаляет null и undefined из типа T и распределяется по union: NonNullable<string | null | undefined> становится string. Он полезен после явной проверки либо при построении сигнатуры, где отсутствие значения уже обработано. Сам alias не выполняет runtime-проверку и не делает выражение безопасным — контрольный поток должен доказать отсутствие nullish значения. При strictNullChecks=false null/undefined участвуют в системе типов иначе, поэтому полезность utility уменьшается; для строгой модели обычно включают strictNullChecks.
