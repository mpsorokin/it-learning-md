# Практика: prototypes, classes и this

## Interview questions

### Реализовать упрощённый new.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-026 -->

#### Ответ

Упрощённая реализация ниже работает для обычной constructable function, которая корректно вызывается через `this`. Она не реализует `new.target`, `extends`, Proxy construct traps, встроенные constructors и class constructors — в реальном коде для общего случая нужен `Reflect.construct`.

    function myNew(ctor, ...args) {
      if (typeof ctor !== 'function') throw new TypeError('Constructor must be callable');
      try {
        Reflect.construct(function () {}, [], ctor);
      } catch {
        throw new TypeError('Constructor must be constructable');
      }

      const prototype = ctor.prototype;
      const instance = Object.create(
        prototype !== null && (typeof prototype === 'object' || typeof prototype === 'function')
          ? prototype
          : Object.prototype,
      );

      const result = Reflect.apply(ctor, instance, args);
      return result !== null && (typeof result === 'object' || typeof result === 'function')
        ? result
        : instance;
    }

Объект/функция, возвращённые конструктором явно, заменяют созданный instance; примитивный return игнорируется. Проверка через `Reflect.construct` отсекает arrow/generator functions, но код остаётся упрощённым: class constructors constructable, однако их нельзя вызвать через `Reflect.apply`; bound functions и Proxy также требуют точного forwarding `new.target`. В production API должен принимать тип `new (...args) => T` и использовать native `new` или `Reflect.construct`.

### Реализовать instanceof.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-027 -->

#### Ответ

Базовый алгоритм сравнивает `value` с объектной prototype chain и не делает deep/type check. Вариант ниже намеренно реализует ordinary `instanceof` для обычного constructor и не учитывает custom `Symbol.hasInstance`/bound-function forwarding — их нужно добавить отдельно, если требуется полная совместимость оператора.

    function ordinaryInstanceOf(value, ctor) {
      if (typeof ctor !== 'function') {
        throw new TypeError('Right-hand side is not callable');
      }
      if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
        return false;
      }

      const prototype = ctor.prototype;
      if (prototype === null || (typeof prototype !== 'object' && typeof prototype !== 'function')) {
        throw new TypeError('Constructor prototype is not an object');
      }

      let current = Object.getPrototypeOf(value);
      while (current !== null) {
        if (current === prototype) return true;
        current = Object.getPrototypeOf(current);
      }
      return false;
    }

Сложность O(h) по высоте prototype chain, дополнительная память O(1). Для точной реализации ECMAScript сначала нужно обработать `@@hasInstance`, а обычный method должен учитывать bound functions. Из-за разных realms и изменения прототипов проверка не заменяет schema validation. Тесты: прямой/наследуемый instance, другой constructor, primitive слева, стрелка без object prototype и null termination.

### Реализовать bind.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-028 -->

#### Ответ

Native bind фиксирует receiver для обычного вызова и заранее применяет начальные аргументы. Если bound-функцию вызывают через `new`, bound `this` игнорируется: создаётся новый instance, а construct передаётся исходной функции. Пример упрощён для constructable functions и опускает часть метаданных спецификации.

    function myBind(target, boundThis, ...boundArgs) {
      if (typeof target !== 'function') throw new TypeError('Target must be callable');

      let bound;
      bound = function (...callArgs) {
        const args = [...boundArgs, ...callArgs];
        if (new.target) {
          return Reflect.construct(
            target,
            args,
            new.target === bound ? target : new.target,
          );
        }
        return Reflect.apply(target, boundThis, args);
      };

      return bound;
    }

`Reflect.construct` сохраняет constructor-поведение target и `new.target` при наследовании bound wrapper-а; class target можно сконструировать, но обычный вызов всё равно выбросит ошибку. Это не полностью повторяет native `name`, `length`, prototype/`instanceof` metadata и bound-function exotic internal slots; метод `Function.prototype.bind` в production не переопределяют. Для unit-тестов проверить привязанный `this`, аргументный порядок, вызов через `new` и явный object return конструктора.

### Написать inheritance без class.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-029 -->

#### Ответ

Без `class` inheritance строится явной prototype-связью, а базовый constructor вызывается с дочерним receiver-ом для инициализации общего состояния.

    function Animal(name) {
      this.name = name;
    }
    Animal.prototype.speak = function () {
      return `${this.name} makes a sound`;
    };

    function Dog(name, breed) {
      Animal.call(this, name);
      this.breed = breed;
    }
    Dog.prototype = Object.create(Animal.prototype);
    Object.defineProperty(Dog.prototype, 'constructor', {
      value: Dog,
      writable: true,
      configurable: true,
    });
    Dog.prototype.bark = function () {
      return `${this.name} barks`;
    };

    const dog = new Dog('Rex', 'collie');
    dog instanceof Dog;    // true
    dog instanceof Animal; // true

Ключевой шаг — новый `Dog.prototype` с `Animal.prototype` в chain; простое присваивание `Dog.prototype = Animal.prototype` было бы ошибкой, так как методы потомка загрязнили бы базовый prototype. Сброшенное свойство `constructor` восстанавливают явно. В modern code `class extends` безопаснее и короче; exercise нужен, чтобы понимать underlying цепочку. Проверить независимость state между инстансами и оба `instanceof`.

### Разобрать tricky this examples.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-030 -->

#### Ответ

В задании не приведены конкретные выражения, поэтому разбор нужно привязать к call-site. Несколько типичных случаев:

    const obj = {
      value: 1,
      getValue() { return this.value; },
    };
    obj.getValue();                 // 1: receiver — obj
    const detached = obj.getValue;
    detached();                     // TypeError в strict mode; в sloppy script this будет globalThis
    detached.call({ value: 2 });    // 2: receiver задан явно
    const fixed = detached.bind({ value: 3 });
    fixed.call({ value: 4 });       // 3: bind нельзя переопределить call

В strict mode detached-вызов выше выбросит TypeError, потому что `this` равен `undefined` и код читает `this.value`; в sloppy classic script `this` станет global object, обычно вернув его свойство `value` либо `undefined`. Вложенная arrow сохраняет `this` внешнего method, а обычная nested function получает новое значение по своему вызову. В `new obj.method()` receiver экземпляра создаётся для вызова method как constructor, а не равен `obj`.

На интервью каждое выражение переписываю как: какая именно функция вызывается, в каком синтаксическом виде, есть ли Reference receiver, строгий ли режим и не является ли функция arrow/bound. Нельзя предсказывать `this` только по месту, где функция была объявлена.

### Найти prototype pollution vulnerability.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-031 -->

#### Ответ

Prototype pollution — изменение prototype объекта (часто `Object.prototype`) через неконтролируемый ключ из недоверенных данных. Уязвима рекурсивная merge-функция, которая перебирает ключи и пишет в `target[key]`: специальный ключ `__proto__` может обратиться к legacy setter, а цепочка `constructor.prototype` — к общему prototype. После этого проверка вроде `if (user.isAdmin)` может увидеть унаследованное свойство, которого не было в самом user-объекте.

Опасная форма — принимать произвольные JSON config/patch и рекурсивно копировать все поля без allowlist. JSON.parse сам создаёт own key `__proto__`, но небезопасная merge/assign семантика может превратить его в mutation. Это способно обойти authorization, изменить defaults или повредить работу библиотек; impact зависит от дальнейшего использования загрязнённого свойства.

Защита: валидировать данные схемой и строить объект только из разрешённых полей; рекурсивно отклонять `__proto__`, `constructor` и `prototype` там, где это нужно; для arbitrary dictionaries использовать `Object.create(null)`/Map; проверять own properties через `Object.hasOwn`; обновить merge dependencies. Не считать `Object.freeze(Object.prototype)` универсальным исправлением — оно может ломать приложения и не устраняет pollution других targets. Добавить regression-тест с вредоносными ключами и проверять отсутствие неожиданных inherited properties.
