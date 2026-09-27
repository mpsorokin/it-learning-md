# Inheritance, composition и instanceof

## Interview questions

### Static properties/methods.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-009 -->

#### Ответ

Static method/property находится на constructor-функции/самом классе, а не на instance prototype. Её вызывают как `User.create()`, и внутри обычного static method `this` обычно указывает на класс, через который его вызвали; это позволяет написать polymorphic factory, если наследники наследуют static method. Instance не получает такой метод: `new User().create` будет `undefined`, если поле отдельно не определено.

При `class Child extends Base` наследуется и экземплярная цепочка (`Child.prototype → Base.prototype`), и constructor-цепочка (`Child → Base`), поэтому static методы базового класса доступны потомку через lookup. Static block выполняется один раз при инициализации класса и подходит для настройки статического состояния с доступом к private static fields.

Не делайте static mutable state незаметным глобальным registry: состояние делится между всеми экземплярами и может усложнить тесты/изоляцию. Для конфигурации и фабрик полезны явные зависимости и продуманная область жизни.

### Private fields #foo.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-010 -->

#### Ответ

Private field `#foo` — встроенный механизм приватных slots класса с проверкой brand, а не обычное свойство с особым именем. Оно объявляется в теле класса и доступно только коду этого класса (и определённым вложенным функциям); нельзя прочитать через `obj['#foo']`, `Object.keys`, Proxy reflection или наследнику, если field не объявлено там отдельно. Обращение к объекту без соответствующего brand бросает TypeError.

Поля являются per-instance, а private static fields — per-class. Наследник не получает private field базового класса через обычный property lookup, хотя методы базового класса могут обращаться к нему на экземпляре, который удовлетворяет brand. Два класса могут объявить `#x` независимо без конфликта.

Это runtime-инвариант и лучшая защита инкапсуляции, чем TypeScript `private`, который в большинстве случаев снимается при компиляции. Но private field не шифрует данные от debugger/process memory и не является security boundary против самого host/доверенного исполняемого кода.

### Что такое inheritance в JS?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-011 -->

#### Ответ

Inheritance в JavaScript — делегирование property lookup по prototype chain. Если свойство/метод отсутствует у объекта, оно ищется в его `[[Prototype]]`; class syntax и `extends` строят эту цепочку и связывают constructors. Объекты могут наследовать поведение без жёсткой схемы класса через `Object.create`, хотя ручное изменение chain усложняет оптимизацию.

Классическое наследование моделирует «is-a», но технически потомок получает доступ к унаследованным методам и может переопределить их; инстансный метод при вызове получает дочерний объект как `this`. `super.method()` вызывает метод базового prototype с receiver-ом текущего экземпляра. Замена метода у родителя может поменять поведение всех потомков.

JS имеет single prototype chain; множественное наследование напрямую не предусмотрено. Длинная иерархия усиливает связанность и затрудняет локальное тестирование, поэтому наследование стоит оставлять для стабильных «is-a» отношений/общего инварианта и часто предпочитать композицию.

### Composition vs inheritance.
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-012 -->

#### Ответ

Inheritance повторно использует реализацию через общую цепочку прототипов и выражает подтипность, но связывает потомка с деталями базового класса: изменение/переопределение базового поведения способно сломать потомков, а single inheritance вынуждает выбирать одну родительскую ось. Хороший базовый тип должен иметь устойчивый контракт и соблюдать Liskov substitution: потомок не должен нарушать ожидания потребителя.

Composition строит объект из меньших объектов/функций («has-a»). Зависимости можно подменять и тестировать независимо; поведение добавляется точечно. Цена — явное делегирование и wiring, иногда больше объектов и необходимость определить lifecycle. В JS это обычно простой объект с injected service/strategy.

Практическое правило: наследовать, когда подтип действительно взаимозаменяем с базовым и API устойчив; компоновать, когда хочется переиспользовать способности без отношения подтипа. Для малых стабильных иерархий наследование допустимо, а не запрещено; выбор проверяют по реальным изменениям требований и тестопригодности.

### Что такое mixins?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-013 -->

#### Ответ

Mixin — паттерн добавления поведения объекту/классу без отдельного базового типа на каждое сочетание capabilities. В JS mixin часто задаётся функцией, которая принимает base class и возвращает подкласс с дополнительными методами. Другой вариант — копировать набор методов, но это уже требует политики конфликтов и дескрипторов.

    type Constructor<T = object> = new (...args: any[]) => T;

    function Timestamped<TBase extends Constructor>(Base: TBase) {
      return class extends Base {
        createdAt = new Date();
      };
    }

    class Entity { constructor(public id: string) {} }
    const TimestampedEntity = Timestamped(Entity);

Преимущества — повторное использование ортогонального поведения и сборка capabilities. Риски — порядок mixin-ов меняет результат, одинаковые имена конфликтуют, типы становятся сложными, возникают скрытые требования к базовому классу и state lifecycle. Документируйте контракт/порядок применения и тестируйте композицию; для простого поведения часто яснее передать объект-компонент.

### Как работает instanceof?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-014 -->

#### Ответ

Для обычного callable constructor `value instanceof Constructor` проверяет, находится ли `Constructor.prototype` в prototype chain значения. Сравнивается identity объектов, а не структура или поле `constructor`. Primitive слева даёт `false`, но некорректный RHS или не-object `Constructor.prototype` может привести к TypeError. Между разными iframe/realm один и тот же встроенный constructor имеет другую identity/prototype, поэтому `[] instanceof Array` из другого realm бывает false.

Оператор сначала учитывает пользовательский `Symbol.hasInstance`, если он определён; стандартный метод `Function.prototype[Symbol.hasInstance]` выполняет ordinary chain check. `instanceof` отвечает на вопрос о prototype relationship, не доказывает корректность данных или происхождение объекта и не заменяет schema validation.

Для cross-realm проверок обычно надёжнее использовать `Array.isArray`, структурную валидацию или брендированный discriminator. Ручная смена prototype может изменить `instanceof`, не меняя реальное состояние объекта.

### Можно ли изменить поведение instanceof?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-015 -->

#### Ответ

Да. У RHS `instanceof` может быть собственный или унаследованный метод под ключом `Symbol.hasInstance`. Оператор получает этот method и вызывает его с проверяемым значением; если метод возвращает truthy, результат будет true. Это позволяет описать membership по бренду/контракту, а не по цепочке прототипов.

Например, класс может определить static `[Symbol.hasInstance](value)`, который проверяет наличие валидного brand. При этом кастомный метод обязан быть быстрым, детерминированным и безопасным: он выполняется как обычный пользовательский код, может иметь побочные эффекты или бросить исключение. Использовать его для дорогой глубокой валидации в каждом условии нежелательно.

Изменять `Constructor.prototype` тоже меняет результат обычного chain check для последующих сравнений, а смена прототипа объекта — для конкретного значения. Такие изменения могут разрушить предположения производственного кода; лучше определить стабильную модель идентичности.

### Что делает Symbol.hasInstance?
<!-- question-id: fullstack-interview-02-js-objects-prototypes-oop-016 -->

#### Ответ

`Symbol.hasInstance` — well-known symbol, через который оператор `instanceof` получает метод проверки экземпляра. `Function.prototype` предоставляет стандартную реализацию для обычных функций/классов: она проверяет объектность левого значения и ищет `this.prototype` по его prototype chain. Статически можно задать собственный method на классе:

    class EvenNumber {
      static [Symbol.hasInstance](value: unknown): boolean {
        return typeof value === 'number' && Number.isInteger(value) && value % 2 === 0;
      }
    }

    4 instanceof EvenNumber; // true

В этом примере оператор проверяет контракт «чётное целое число», хотя число не может иметь прототип `EvenNumber.prototype`. Это удобно для абстрактных interface-like categories, но нетипично: `instanceof` начинает означать не реальное происхождение. Method обязан вернуть boolean-подобный результат; исключение из него распространяется вызывающему коду. Для валидации данных обычно понятнее named predicate.
