# Compilation и runtime constructs

## Interview questions

### Что остаётся от TypeScript после compilation?
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-001 -->

#### Ответ
TypeScript компилируется в JavaScript. Аннотации типов, `interface`, `type`, generic-параметры, `as` и другие конструкции, нужные только для проверки, стираются: движок JavaScript их не видит. В зависимости от `target` и `module` компилятор также может преобразовать синтаксис в более старый JS. Конструкции с поведением во время выполнения, например `class` или обычный `enum`, могут породить JavaScript-код.

Проверка типов и генерация файлов — разные этапы: настройки вроде `noEmitOnError` определяют, будут ли файлы выпущены при ошибках типов. Сама компиляция не добавляет runtime-валидацию входных данных.

### Что происходит с interfaces?
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-002 -->

#### Ответ
`interface` существует только во время проверки типов и стирается при emit. `implements` проверяет на этапе компиляции, что класс соответствует контракту, но не добавляет проверку объекта при создании и не создаёт объект-интерфейс в JavaScript. Поэтому у интерфейса нет конструктора, по которому можно определить тип значения во время выполнения.

Для runtime-проверки нужен исполняемый механизм: класс, type guard или схема, например Zod. Они решают разные задачи: класс создаёт runtime-конструктор, а guard или schema проверяют фактические данные.

### Почему нельзя:
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-003 -->

```ts
user instanceof UserInterface
```

?

#### Ответ
`UserInterface` — type-only имя, и после компиляции соответствующего JavaScript-значения нет. Выражение `instanceof` выполняется во время выполнения и требует справа объект-конструктор либо объект с пользовательским `Symbol.hasInstance`. TypeScript поэтому сообщает, что интерфейс используется в позиции значения.

Если нужно проверить форму данных, напишите type guard или запустите runtime-схему. Переименование интерфейса в `class` сработает для экземпляров этого класса, но само по себе не валидирует произвольный JSON.

### Почему можно:
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-004 -->

```ts
user instanceof AdminUser
```

?

#### Ответ
`AdminUser` в этом примере — `class`, а значит, это runtime-конструктор JavaScript. По умолчанию `instanceof` проверяет, находится ли `AdminUser.prototype` в цепочке прототипов левого значения; пользовательское поведение возможно через `Symbol.hasInstance`.

Это проверка происхождения/цепочки прототипов, а не проверка полей. Объект с подходящими полями может вернуть `false`, если не создан через этот конструктор; экземпляр из другого realm (например, другого `iframe`) также часто не проходит проверку. Для проверки внешних данных используйте schema validation.

### Какие TS constructs существуют runtime?
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-005 -->

#### Ответ
Runtime-поведение остаётся у конструкций, которые компилятор эмитит как JavaScript: `class`, обычные `enum`, некоторые формы `namespace`, а также преобразования синтаксиса, например parameter properties в constructor assignments. Decorators могут давать runtime-вызовы, если они включены и поддержаны выбранным режимом компиляции.

Типовые конструкции (`interface`, `type`, generics, аннотации, type assertions, `satisfies`) не создают проверок во время выполнения. Точный emit зависит от версии TypeScript, `target`, `module`, параметров декораторов и транспилятора: Babel/SWC могут преобразовывать код иначе, чем `tsc`.

### Что происходит с enum?
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-006 -->

#### Ответ
Обычный `enum` генерирует runtime-объект. Строковый enum хранит отображение «имя → строковое значение», числовой обычно получает ещё и обратное отображение «число → имя». Его значения можно передавать в JS, перечислять и сериализовать; это дополнительный код, которого у type-only union нет.

Выбор зависит от контракта: enum удобен, когда нужен объект-namespace во время выполнения; для простого доменного union иногда достаточно строковых literal types или `as const`-объекта. Не полагайтесь на автоматически назначенные числовые значения как на стабильный wire-format. [TypeScript Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html)

### Что происходит с const enum?
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-007 -->

#### Ответ
При обычном emit `tsc` члены `const enum` подставляются в места использования, а сам enum удаляется: отдельного объекта для него нет. Это сокращает runtime-код, но требует, чтобы трансформер знал значения enum при компиляции.

Есть межпроектные риски для ambient `const enum`: потребитель может встроить значения одной версии пакета, а во время выполнения подключить другую. Однофайловые транспиляторы и `isolatedModules` также ограничивают некоторые варианты; `preserveConstEnums` меняет emit. В библиотечном API безопаснее не публиковать ambient const enums без понимания pipeline потребителей. [TypeScript Handbook: const enum pitfalls](https://www.typescriptlang.org/docs/handbook/enums.html#const-enum-pitfalls), [isolatedModules](https://www.typescriptlang.org/tsconfig/isolatedModules.html)

### Compile-time validation vs runtime validation.
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-008 -->

#### Ответ
Compile-time checking сопоставляет выражения в исходниках с объявленными типами. Оно ловит несоответствия там, где код прошёл проверку, но не осматривает будущие значения из сети, local storage, очереди или файла.

Runtime validation выполняет код над фактическим значением: проверяет поля, типы и доменные ограничения, после чего принимает, преобразует или отвергает данные. На границе системы безопасная схема обычно принимает `unknown`, возвращает проверенный тип либо структурированную ошибку. Нужны оба слоя: TypeScript помогает разработчику внутри приложения, валидатор защищает границы во время работы.

