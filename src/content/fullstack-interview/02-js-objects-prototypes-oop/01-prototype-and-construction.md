# Prototype, lookup и construction

## Interview questions

### Что такое prototype?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-001 -->

#### Ответ

В разговорном смысле prototype может означать объект, который служит другим объектам источником унаследованных свойств. У каждого ordinary object есть внутренний слот `[[Prototype]]`, ссылающийся на объект или `null`; его можно исследовать через `Object.getPrototypeOf`. Отдельно у большинства обычных constructor functions есть публичное свойство `prototype`, которое будет `[[Prototype]]` у экземпляров, созданных через `new`.

Эти два значения не надо смешивать: `Foo.prototype` — обычное свойство функции-конструктора, а `instance.[[Prototype]]` — внутренняя ссылка самого экземпляра. У объекта, созданного object literal, цепочка обычно идёт к `Object.prototype`; у `Object.create(null)` верхний прототип равен null. Изменения общего prototype видны экземплярам через lookup, что позволяет разделять методы, но глобальная мутация prototype опасна конфликтами и неожиданным поведением.

### Что такое prototype chain?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-002 -->

#### Ответ

Prototype chain — последовательность объектов, по которой property lookup ищет отсутствующее собственное свойство: сначала проверяется receiver, затем его `[[Prototype]]`, далее прототипы до `null`. Обычно chain формируется при создании объекта и может быть изменена `Object.setPrototypeOf`, но такая мутация часто ухудшает оптимизацию движка; лучше задавать прототип при создании (`class`, `Object.create`).

Метод, найденный в chain, вызывается с исходным receiver как `this`: shared method из `Person.prototype` при вызове `person.describe()` получает `person`. Затеняющее собственное свойство может скрыть унаследованный метод. Унаследованные setters/getters и writable-правила также влияют на присваивание: обычное присваивание часто создаёт own property на receiver, а не меняет объект-прототипа.

Для проверки собственного свойства используйте `Object.hasOwn(obj, key)`; `key in obj` проверяет всю цепочку. Не перебирайте доверие к объектным данным только на `in`, особенно для security-sensitive flags.

### Чем prototype отличается от __proto__?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-003 -->

#### Ответ

`Foo.prototype` — обычное свойство функции-конструктора, используемое алгоритмом `new` для выбора prototype будущего экземпляра. У самого созданного объекта есть внутренний `[[Prototype]]`; это иное поле, даже если традиционный getter `__proto__` позволяет прочитать или изменить его. Для чтения/создания прототипной связи предпочтительны стандартизованные `Object.getPrototypeOf`, `Object.setPrototypeOf` и `Object.create`.

`__proto__` — legacy accessor из `Object.prototype`, а не универсальный внутренний слот и не собственное поле каждого объекта. Он может быть затенён, отсутствовать у null-prototype object и при установке имеет особое поведение. Object literal также исторически позволяет задать `__proto__` как специальную запись, что отличается от обычного JSON property.

Переопределять prototype после создания экземпляров не значит менять их текущий `[[Prototype]]`: экземпляры сохраняют ссылку на прежний объект, хотя изменение самого объекта prototype будет видно им. Runtime-мутация цепочек усложняет reasoning и обычно не подходит для hot path.

### Как работает property lookup?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-004 -->

#### Ответ

Для чтения `obj.name` движок сначала выполняет Get на receiver: проверяет собственное свойство, а затем при отсутствии идёт по `[[Prototype]]`. Если найден data property, возвращает его value; если accessor property — вызывает getter с receiver, а не с объектом, на котором getter был найден. Если нигде не найдено, результат `undefined`.

Для `name in obj` проверяется наличие свойства во всей chain, в то время как `Object.hasOwn(obj, 'name')` — только own property. `Object.keys` перечисляет собственные enumerable string keys; `Reflect.ownKeys` возвращает собственные string и Symbol keys независимо от enumerable. `for...in` включает enumerable string properties из прототипов, поэтому легко случайно обработать унаследованные поля.

Прототипные getters, Proxy traps и accessors могут запускать код/бросать ошибки; property lookup не всегда чистая операция. Для входных словарей используйте явную схему/валидацию и own-property проверки, чтобы не принять унаследованный `isAdmin` за пользовательские данные.

### Что происходит при new Foo()?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-005 -->

#### Ответ

Для обычного вызова `new Foo(args)` алгоритм создания экземпляра в общих чертах такой: проверить, что `Foo` constructable; создать новый объект и задать его `[[Prototype]]` из значения `Foo.prototype` (если оно не object — использовать стандартный fallback); вызвать `Foo` с новым объектом в роли `this` и передать аргументы; если конструктор вернул объект/функцию, результатом `new` будет этот явно возвращённый объект, иначе — созданный экземпляр.

Функция видит `new.target`, когда была сконструирована. Для derived classes базовый конструктор определяет порядок инициализации `this`; до `super()` обращаться к нему нельзя. Arrow functions, async functions и generators не constructable, а class constructor нельзя вызвать без `new`.

Это удобная модель обычного `new`, но спецификация формализует операцию через `[[Construct]]`, `newTarget` и `OrdinaryCreateFromConstructor`; Proxy может перехватить construct. Для корректного forwarding constructor/newTarget используйте `Reflect.construct`, а не самодельный вызов через `apply`.

### Что реально делает class в JavaScript?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-006 -->

#### Ответ

`class` — синтаксис языка для создания constructor и методов, организованных вокруг prototype chain. Инстансные методы класса обычно размещаются на `ClassName.prototype`, static methods/properties — на самой constructor-функции; поля экземпляра создаются для каждого объекта. `extends` формирует две связи: прототип экземпляра к `Base.prototype` и constructor-потомка к базовому constructor.

Классы не являются только текстовой обёрткой: они имеют семантические отличия. Их нельзя вызвать без `new`, тело работает в strict mode, методы non-enumerable, декларации классов не поднимаются так же, как function declarations, есть private `#fields`, `super`, derived constructors и `new.target`. Но наследование всё равно основано на объектах и прототипах, без отдельной классической runtime-модели типов.

Class fields создаются на экземпляре и инициализируются в специфицированном порядке относительно `super()` и тела конструктора. Для сложной иерархии полезно предпочесть композицию: синтаксис `extends` облегчает sharing, но не отменяет tight coupling и ограничения single inheritance.

### Чем JS classes отличаются от Java/C# classes?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-007 -->

#### Ответ

Главное отличие — модель: Java и C# в основном используют номинальные типы и class-based inheritance, а JavaScript — объектную делегацию через prototype chain. JS `class` добавляет знакомый синтаксис, но экземпляр ищет унаследованный метод через объекты prototype; динамическое изменение свойств и prototype возможно во время выполнения.

Java/C# проверяют многие ошибки типов статически и имеют более фиксированную схему class members; JavaScript динамически типизирован. TypeScript добавляет статическую проверку поверх JS, но стирает типы при компиляции и не создаёт runtime-классы/валидацию, которых нет в исходном JS. В JS классы остаются first-class values, constructor-функциями и prototype-объектами.

Сходства тоже есть: `new`, конструкторы, инстансные и static методы, наследование и инкапсуляция (в JS — private fields). Нельзя переносить гарантии Java/C# о layout, overload resolution или type identity на JS. Для межграницового контракта используйте runtime validation/schema, если вход реально недоверенный.

### Что такое constructor function?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-008 -->

#### Ответ

Constructor function — обычная constructable function, рассчитанная на вызов с `new`; она инициализирует экземпляр через `this`, а методы можно разместить на её `prototype`, чтобы не создавать копию функции в каждом объекте.

    function User(name) {
      this.name = name;
    }
    User.prototype.greet = function () {
      return `Hello, ${this.name}`;
    };

    const user = new User('Ada');

В актуальном TypeScript обычно следует описать `User` как `class`, а здесь показана модель для старого/function-constructor API. Забытая операция `new` в strict mode приводит к ошибке при записи в `undefined`; в sloppy mode может случайно мутировать global object. Конструктор может вернуть объект и подменить экземпляр, так что обычно этого избегают.

Проверки: конструктор инициализирует отдельное состояние каждого пользователя, method одна на всех экземплярах, `user instanceof User` истинен. Для интеграции сторонней конструкционной функции добавляют точные типы, а не `as unknown` на production boundary.
