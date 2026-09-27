# Type operators

## Interview questions

### typeof в type position.
<!-- question-id: fullstack-interview-03-typescript-core-023 -->

#### Ответ

В type position typeof извлекает статический тип существующего значения: const config = {...}; type Config = typeof config. В отличие от runtime typeof, это оператор компилятора, в JavaScript он не выполняется. Частый шаблон — объединить typeof и keyof: type Key = keyof typeof config; так тип ключей остаётся связан с реальным объектом-конфигурацией. Type-query typeof применим к именам значений и их доступным свойствам, а не произвольному выражению; для типа используют уже обычный type reference. Если значение расширено аннотацией до широкого контракта, typeof отражает этот объявленный тип, а не исходное намерение.

### Indexed access types.
<!-- question-id: fullstack-interview-03-typescript-core-024 -->

#### Ответ

Indexed access type T[K] получает тип свойства K у T, а K обычно ограничивают через K extends keyof T. Если K — union ключей, результат тоже union значений: T["id" | "active"] равен T["id"] | T["active"]. Для массива можно получить тип элемента через T[number], для tuple — типы всех элементов через числовой индекс. Это позволяет писать функцию вроде getProperty<T, K extends keyof T>(obj: T, key: K): T[K] и не терять связь между выбранным ключом и возвращаемым значением. Индекс недопустимого ключа — compile-time error; index signature, напротив, расширяет множество допустимых ключей.

### Mapped types.
<!-- question-id: fullstack-interview-03-typescript-core-025 -->

#### Ответ

Mapped type проходит по union ключей и строит новый тип, например Readonly<T> = { readonly [K in keyof T]: T[K] }. Он позволяет перенести типы значений исходных полей, добавить или снять модификаторы readonly/optional (префиксы + и -), а также фильтровать и переименовывать ключи через as. Стандартные Partial, Required и Readonly построены вокруг этого механизма. Mapped types — compile-time трансформация: объект в runtime не клонируется и не замораживается. Глубокий вариант требует рекурсии и явного решения, что делать с массивами, функциями, Date, Map и другими специальными объектами.

### Conditional types.
<!-- question-id: fullstack-interview-03-typescript-core-026 -->

#### Ответ

Conditional type имеет форму T extends U ? A : B и выбирает ветку исходя из assignability типа T типу U, а не из runtime-значения. Когда проверяемая часть — naked type parameter (сам параметр без обёртки), тип распределяется по union: ToArray<string | number> превращается в string[] | number[]. Обёртка [T] extends [U] проверяет весь union целиком. Необходимо помнить про крайние случаи: T = never при distributive conditional даёт never, а any может объединить обе ветви и сохранить any-подобную неоднозначность. Conditional types полезны для преобразований, но чрезмерная рекурсия/ветвление затрудняет диагностики и увеличивает время проверки.

### Template literal types.
<!-- question-id: fullstack-interview-03-typescript-core-027 -->

#### Ответ

Template literal type строит тип строк по шаблону: type EventName = `on${Capitalize<"click" | "focus">}` даёт "onClick" | "onFocus". Union-ы в подстановках комбинируются, что позволяет генерировать ключи событий, API paths и варианты команды из конечного набора. В сочетании с mapped type и key remapping можно выводить типизированный интерфейс из одной карты. Это только статическое представление; runtime-строка всё ещё требует проверки. Большие unions могут породить комбинаторное число вариантов и резко увеличить время компиляции, поэтому шаблоны держат конечными и простыми, а не заменяют ими runtime routing/parser.

### Utility types.
<!-- question-id: fullstack-interview-03-typescript-core-028 -->

#### Ответ

Utility types — готовые компиляторные преобразования, которые помогают выражать производные контракты без повторения полей. Базовые меняют свойства объекта (Partial, Required, Readonly, Pick, Omit, Record), другие фильтруют union (Exclude, Extract, NonNullable) или извлекают типы функций и Promise (Parameters, ReturnType, Awaited). Большинство utilities — алиасы на условных и mapped types и не выполняют преобразование значений в runtime. Выбирайте их по читаемости: публичное имя доменного типа иногда лучше длинной вложенной композиции. И не путайте статический Readonly с реальной runtime-защитой Object.freeze.
