# Property descriptors и freezing

## Interview questions

### Что такое property descriptors?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-017 -->

#### Ответ

Descriptor — набор атрибутов собственного property, который описывает его поведение. Data descriptor содержит `value` и `writable`; accessor descriptor — `get` и/или `set`. У обоих есть `enumerable` (участвует ли, например, в `Object.keys`) и `configurable` (можно ли удалить/переопределить или менять тип descriptor). Data и accessor атрибуты нельзя смешивать в одном descriptor.

`Object.getOwnPropertyDescriptor(obj, key)` читает descriptor одного собственного свойства, `Object.getOwnPropertyDescriptors` — всех; `Object.defineProperty` задаёт descriptor. Важно: при обычном присваивании новое own data property обычно создаётся writable/enumerable/configurable, но descriptor влияет на присваивание. Дескрипторы — полезный механизм библиотек/runtime и инвариантов API, но чрезмерное применение усложняет сериализацию и тесты.

Для accessor getter/setter `this` — receiver при доступе, даже если getter найден на prototype. Proxy может перехватить операции с собственными property, а некоторые встроенные объекты используют internal slots, которые нельзя эмулировать одним descriptor.

### writable, enumerable, configurable.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-018 -->

#### Ответ

Для data property `writable` разрешает менять значение, `enumerable` включает его в обычное перечисление вроде `Object.keys`/`for...in`, `configurable` разрешает удалить property и менять его тип/атрибуты. Для accessor property нет `writable`; вместо него `get`/`set`, а `enumerable` и `configurable` работают аналогично.

У `Object.defineProperty` атрибуты, не указанные в descriptor, по умолчанию `false` (getter/setter по умолчанию отсутствуют). Это отличается от обычного присваивания, которое создаёт «обычные» writable/enumerable/configurable properties. Когда configurable=false, нельзя переключить data/accessor descriptor или менять enumerable; для непр writable свойства существуют лишь узкие исключения.

В strict mode запись в не-writable property или отсутствие setter выбрасывает TypeError; в sloppy mode запись может молча не сработать. Для строгих immutable контрактов не полагайтесь только на флаг — тестируйте поведение и помните про вложенные mutable значения.

### Object.freeze vs seal vs preventExtensions.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-019 -->

#### Ответ

`Object.preventExtensions(obj)` запрещает добавлять собственные свойства, но существующие можно менять/удалять в пределах их descriptors. `Object.seal(obj)` дополнительно делает все own properties non-configurable, поэтому их нельзя удалить или переподключить, но writable data properties всё ещё можно менять. `Object.freeze(obj)` также делает own data properties non-writable; accessor setter при этом не удаляется и по-прежнему может менять внешнее состояние.

Все три операции меняют сам объект и являются shallow. Они не рекурсивны по prototype chain и не замораживают вложенные значения. Возвращают тот же объект, что удобно для chaining. В strict mode запрещённая операция обычно бросает TypeError; в non-strict поведение может быть no-op. `Object.isExtensible`, `Object.isSealed`, `Object.isFrozen` позволяют проверить состояние.

Frozen object не равен безопасно immutable value, если внутри есть mutable object или accessor с побочным эффектом. Для security boundary нужна валидация/копирование входа и запрет опасных mutation-путей, а не только `freeze`.

### Почему Object.freeze shallow?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-020 -->

#### Ответ

Freeze действует на object value, переданный в `Object.freeze`: он меняет descriptors только собственных properties этого объекта. Вложенные properties, если сами являются ссылками на объекты, остаются теми же mutable объектами; замороженная запись `settings.theme.color` всё ещё может ссылаться на изменяемый `theme`.

Рекурсивный deep-freeze можно реализовать обходом графа с `WeakSet` посещённых узлов (для циклов), проверяя `Object.getOwnPropertyDescriptors` и замораживая вложенные значения. Но это всё равно не универсальная immutability: Proxy может иметь traps, TypedArray/DataView имеют особое поведение, а accessor может менять внешнее состояние; также не обязательно замораживать prototype или shared dependencies.

В приложениях часто лучше использовать immutable update, schema/readonly типы и не передавать владельца изменяемой ссылки. TypeScript `Readonly<T>` действует только на уровне compile-time и, как правило, shallow; runtime `freeze` и static readonly решают разные задачи.
