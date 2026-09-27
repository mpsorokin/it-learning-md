# Generics и inference

## Interview questions

### Что такое Generics?
<!-- question-id: fullstack-interview-04-typescript-advanced-001 -->

#### Ответ

Generics параметризуют тип алгоритма или API и связывают типы входа с выходом, сохраняя конкретную информацию без копирования реализации для каждого типа. Например, identity<T>(value: T): T возвращает ровно тот тип, который получил; в отличие от any это отношение проверяется компилятором. Параметры могут быть у функций, интерфейсов, классов и type aliases, а их значения существуют только на уровне типов — в обычном JavaScript runtime они стираются. Generic полезен, если T реально влияет на контракт нескольких позиций; неиспользуемый параметр или бессмысленный T extends any усложняет сигнатуру и не повышает безопасность.

### Для чего generic constraints?
<!-- question-id: fullstack-interview-04-typescript-advanced-002 -->

#### Ответ

Constraint ограничивает множество допустимых аргументов типа и даёт реализации безопасно пользоваться гарантированными операциями/свойствами. Например:

```ts
function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}
```

Это не превращает T в constraint: возвращаемый тип по-прежнему может сохранять конкретный подтип. Constraint также не означает, что можно создать любое T из объекта constraint — вызывающая сторона могла передать более узкий тип. Для ссылок на поля используют K extends keyof T; для нескольких требований — intersection constraint. Не сужайте constraint до any ради устранения ошибки: сначала определите минимальные гарантии, которые алгоритм действительно использует.

### Что делает T extends U?
<!-- question-id: fullstack-interview-04-typescript-advanced-003 -->

#### Ответ

Значение зависит от контекста. В объявлении generic, как в function f<T extends U>, это constraint: аргумент типа T должен быть assignable к U, и тело получает возможность использовать свойства U. В conditional type, как в T extends U ? A : B, это проверка assignability, выбирающая ветвь; при naked type parameter conditional может распределяться по union. В объявлении interface/type class extends — это наследование/расширение контракта. Ни один вариант не является runtime-проверкой и не означает классическое «T обязательно является подтипом U в номинальной системе»: TS использует структурную assignability.

### Generic default values.
<!-- question-id: fullstack-interview-04-typescript-advanced-004 -->

#### Ответ

Default для type parameter делает его необязательным, если вызывающий не указал аргумент типа и inference не нашёл подходящего кандидата. Например, type Result<T, E = Error> сохраняет короткую запись Result<User>; default обязан удовлетворять constraint. Required type parameters не могут идти после optional parameters с default. Вызывающий может явно задать аргумент и переопределить default; для функций сначала работает inference из аргументов, а default служит fallback. Default типа не является значением по умолчанию в JavaScript и не создаёт runtime object. В дизайне библиотечного API это полезно для обратной совместимости, но default может скрыть важную неопределённость ошибки/результата, если он выбран слишком конкретным.

### Generic inference.
<!-- question-id: fullstack-interview-04-typescript-advanced-005 -->

#### Ответ

Inference — вывод аргументов generic-типа компилятором по контексту вызова: позициям параметров, ограничениям, контекстному типу результата и variance-кандидатам. Обычно функция infer-ит из фактических аргументов: first<T>(items: T[]): T получает T из массива; при нескольких аргументах TS ищет общий подходящий тип или union в зависимости от позиции и контекста. Имена generic-параметров сами по себе не влияют на вывод. Widening может превратить литерал в string/number, если его не удерживает const-контекст, as const, satisfies или const type parameter (TS 5.0+). Если API теряет нужную связь, сначала улучшите форму сигнатуры, а потом явно указывайте тип или используйте helper; type assertion не исправляет неверный runtime-контракт.
