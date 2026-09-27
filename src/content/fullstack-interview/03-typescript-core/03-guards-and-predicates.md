# Guards и predicates

## Interview questions

### typeof.
<!-- question-id: fullstack-interview-03-typescript-core-014 -->

#### Ответ

typeof — JavaScript-оператор с ограниченным набором строковых результатов: "string", "number", "bigint", "boolean", "symbol", "undefined", "function" и "object". Он работает для примитивов, но есть исторические ловушки: typeof null === "object"; массивы тоже дают "object"; NaN имеет тип "number". Для null проверяйте value === null, массив — Array.isArray, а конечность числа — Number.isFinite. После typeof TS сужает union, например string | number до string в ветке typeof x === "string". Для объектов одного typeof недостаточно, чтобы доказать форму полей — нужна проверка структуры.

### instanceof.
<!-- question-id: fullstack-interview-03-typescript-core-015 -->

#### Ответ

instanceof в JavaScript проверяет, встречается ли prototype правого конструктора в цепочке прототипов левого значения; TS использует успешную проверку как narrowing. Подходит для классов и встроенных конструкторов в одном runtime realm. Ограничения: одинаковый класс, загруженный в разных iframe/realm, имеет разные объекты prototype; объекты, созданные без new или десериализованные из JSON, не становятся экземплярами доменного класса. Поведение можно переопределить через Symbol.hasInstance. Для сетевых plain objects используйте structural validation/схему, а не instanceof; для массивов есть Array.isArray.

### in.
<!-- question-id: fullstack-interview-03-typescript-core-016 -->

#### Ответ

Оператор in проверяет наличие свойства в объекте или его prototype chain и может сузить union по ключу: если "swim" in value, остаются типы, где это свойство объявлено. Для optional-свойства тип может остаться в обеих ветках: наличие проверяется в true-ветке, отсутствие не исключает тип из false-ветки, так как поле могло быть опущено. Проверяйте объектность до in, когда вход имеет unknown, и учитывайте, что in видит унаследованные свойства; для проверки только собственных полей есть Object.hasOwn (с соответствующим narrowing или отдельной валидацией). Ключ должен быть допустим для оператора JavaScript.

### User-defined type predicates.
<!-- question-id: fullstack-interview-03-typescript-core-017 -->

#### Ответ

Пользовательский predicate объявляет контракт narrowing в сигнатуре: function isUser(value: unknown): value is User. Реализация возвращает boolean, но компилятор в общем случае не доказывает, что логика действительно проверила все поля User; ответственность за soundness лежит на авторе. Predicate особенно полезен, когда проверку можно выразить обычным runtime-кодом и переиспользовать. Для вложенных/сложных контрактов лучше использовать runtime schema с parse/safeParse: она валидирует фактические данные и сообщает, где нарушен контракт. Не маскируйте приведение к User внутри guard без настоящей проверки, иначе типобезопасность только кажется.

### Assertion functions.
<!-- question-id: fullstack-interview-03-typescript-core-018 -->

#### Ответ

Assertion function — функция-проверка, чья сигнатура обещает: если она завершилась, условие выполнено. Формы: function assert(condition: unknown): asserts condition и function assertIsUser(value: unknown): asserts value is User. В отличие от predicate, вызывающий код не ветвится по boolean; при неуспехе реализация должна бросить исключение или иначе не завершиться. TS доверяет декларации и не сверяет тело с обещанием, поэтому неверное assertion превращает ошибки типов в runtime-баги. Такие функции полезны для инвариантов и fail-fast проверок. Не используйте их вместо проверки данных, если реализация не выполняет полноценную валидацию.
