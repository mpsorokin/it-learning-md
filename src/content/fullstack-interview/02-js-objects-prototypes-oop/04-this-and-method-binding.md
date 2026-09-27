# this и method binding

## Interview questions

### Как работает this?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-021 -->

#### Ответ

Для обычной функции значение `this` определяется способом вызова, а не местом объявления. При `obj.method()` receiver — `obj`; при `method()` без receiver в strict mode `this` равен `undefined`, а в sloppy mode подставляется global object (в зависимости от callable); вызов через `call/apply` задаёт receiver явно, `new` связывает его с новым экземпляром. Class methods работают в strict mode.

У arrow function нет собственного `this`: она лексически использует `this` внешнего окружения. Это не связано с scope chain обычных переменных, хотя тоже определяется лексически. Getter/setter и method вызов следуют обычной call-site семантике; передача ссылки на метод отдельно от объекта меняет call-site.

Top-level `this` зависит от host и вида файла: classic script браузера, ES module, CommonJS wrapper и Node REPL различаются. Поэтому в интервью нужно уточнить режим и среду. Надёжный код явно bind-ит необходимый receiver или передаёт closure, не предполагая глобальный `this`.

### this в arrow function.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-022 -->

#### Ответ

Arrow function не создаёт собственного `this`, `arguments`, `super` или `new.target`; при обращении к ним использует значения ближайшего внешнего lexical context. Поэтому она подходит для callback-а, который должен сохранить `this` окружающего метода:

    class Counter {
      value = 0;
      start() {
        setInterval(() => { this.value++; }, 1000);
      }
    }

У arrow нет `[[Construct]]`, её нельзя вызывать через `new`; `call`, `apply` и `bind` не могут заменить её lexical `this` (bind может частично применить аргументы, но не изменить receiver). В object literal стрелочная функция также не получает объект как this автоматически.

Не объявляйте все class methods arrow-ами по привычке: instance field arrow создаёт новую функцию на каждый объект и может увеличить память; обычный method разделяется через prototype. Выбор определяется потребностью в autobinding и профилем объекта.

### call, apply, bind.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-023 -->

#### Ответ

`fn.call(thisArg, a, b)` вызывает функцию немедленно с указанным `this` и отдельными аргументами; `fn.apply(thisArg, argsArray)` делает то же, но принимает массивоподобный/iterable набор аргументов; `fn.bind(thisArg, a)` не вызывает функцию, а возвращает bound function с привязанным receiver-ом и частично применёнными аргументами.

У обычной функции `bind` фиксирует `this`; при вызове bound function через `new` этот bound receiver игнорируется, потому что constructor создаёт новый `this`, а свойства prototype исходной функции влияют на цепочку согласно правилам bound constructor. `call/apply/bind` не могут изменить `this` стрелочной функции. Передать `null`/`undefined` как thisArg обычной функции в strict mode означает именно это, а не global object.

При массовой передаче аргументов учитывайте лимиты стека/арности; spread/apply с огромным массивом может упасть. Не создавайте bound callback в цикле без необходимости, поскольку каждое связывание создаёт отдельную функцию.

### Method borrowing.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-024 -->

#### Ответ

Method borrowing — вызов метода с другим совместимым receiver-ом, например `Array.prototype.slice.call(arrayLike)`. Метод получает заимствованный объект как `this`, если он рассчитан на такой receiver. Это удобно для generic built-in методов и переиспользуемого поведения, но современный код часто использует `Array.from`/итераторы или отдельную helper-функцию.

Не все методы generic: встроенные методы Map/Set/Date часто требуют соответствующий внутренний slot и броунчат при вызове на произвольном объекте; приватное поле класса требует brand. Borrowed method также может читать свойства/вызывать getters receiver-а, поэтому вход должен удовлетворять ожидаемому контракту.

Вызов через `.call` или `.apply` указывает receiver явно. Для `super`/private fields и subclass-методов нужно учитывать ограничения языка. Не патчьте built-in prototype ради borrowing; извлекайте функцию и применяйте к конкретному receiver-у, когда семантика действительно подходит.

### Почему потеряется this, если передать метод callback'ом?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-025 -->

#### Ответ

При `const callback = object.method` переменная получает значение функции, но выражение вызова `callback()` уже не содержит Reference к `object`. У обычной функции `this` определяется call-site: в strict mode он станет `undefined`; callback API также может вызвать функцию с собственным `thisArg` согласно своему контракту. Исходный объект автоматически не переносится вместе со ссылкой на метод.

Исправление — сохранить receiver: `object.method.bind(object)` создаёт bound callback; или передать closure `(...args) => object.method(...args)`. Внутри класса можно использовать arrow field, если per-instance функция приемлема. Некоторые APIs принимают явно заданный `thisArg` (например, у отдельных методов Array), но DOM/event и сторонние библиотеки имеют собственные правила.

Нужно осторожно обходиться с методом, переданным как callback: `obj.method.bind(obj)` в render/цикле может создавать новую identity каждый раз и мешать memoization/removal. Привяжите один раз или храните корректную ссылку для cleanup; у React event handlers обычно проще closure с явным обращением к объекту.
