# Variance и модели типизации

## Interview questions

### Что такое variance?
<!-- question-id: fullstack-interview-04-typescript-advanced-020 -->

#### Ответ

Variance описывает, как изменение исходного типа аргумента generic влияет на assignability инстанцированного типа. Например, если Dog assignable к Animal, covariance допускает Producer<Dog> как Producer<Animal>, а contravariance у Consumer меняет направление. Положение T в свойствах, параметрах и результатах задаёт такую связь; если T используется и как вход, и как выход, он часто invariant. В TypeScript variance в основном выводится структурно, а не объявляется обязательно. Явные in/out-аннотации появились в TS 4.7 ([release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html)); они влияют на сравнение generic-инстанциаций, но не переопределяют фактическую структурную форму типа. Применяйте их точечно для сложных recursive/library типов, а не как замену проверке модели.

### Covariance / contravariance / invariance.
<!-- question-id: fullstack-interview-04-typescript-advanced-021 -->

#### Ответ

Пусть Dog — более узкий тип, чем Animal:

```ts
type Animal = { name: string };
type Dog = Animal & { bark(): void };
type Producer<T> = () => T;
type Consumer<T> = (value: T) => void;
type Cell<T> = { get: () => T; set: (value: T) => void };

declare const dogs: Producer<Dog>;
const animals: Producer<Animal> = dogs; // covariance: результат Dog можно использовать как Animal

declare const animalConsumer: Consumer<Animal>;
const dogConsumer: Consumer<Dog> = animalConsumer; // contravariance: потребитель всех Animal принимает Dog

declare const dogCell: Cell<Dog>;
declare const animalCell: Cell<Animal>;
// @ts-expect-error Cell<Dog> не может принимать произвольное Animal
const readWriteAnimal: Cell<Animal> = dogCell;
// @ts-expect-error Cell<Animal> не может гарантировать результат Dog
const readWriteDog: Cell<Dog> = animalCell;
```

Invariance требует точного T: чтение позволяет сузить направление, запись — обратное, поэтому присваивание в обе стороны небезопасно. Это интуиция, а реальная assignability TS зависит от declaration shape и strictFunctionTypes; например, параметры методов остаются более бивариантными для совместимости, а mutable-массивы допускают известную unsoundness. Не полагайтесь только на математическую модель при публичном API: проверьте назначенные функции компилятором в strict-режиме.

### Structural typing.
<!-- question-id: fullstack-interview-04-typescript-advanced-022 -->

#### Ответ

Структурная типизация означает, что совместимость определяется набором доступных полей/сигнатур, а не именем объявления или местом, где тип определён. Поэтому отдельный объект с { id: string } совместим с интерфейсом User, требующим лишь id: string; подтип с дополнительными полями также обычно можно присвоить переменной базового типа. Это снижает boilerplate и хорошо сочетается с duck typing JavaScript. Ограничения: случайное смешение семантически разных значений одинаковой формы (например, два string ID) не ловится; excess-property checks для свежих object literals — специальная проверка вероятных опечаток, а не номинальная система. Для доменных различий используйте бренды.

### Nominal typing и как его эмулировать.
<!-- question-id: fullstack-interview-04-typescript-advanced-023 -->

#### Ответ

Номинальная система требует совпадения идентичности/имени типа, даже если структуры совпадают. TypeScript преимущественно структурный, поэтому два алиаса string взаимозаменяемы. Эмулировать номинальный маркер можно скрытым или unique-symbol ключом:

```ts
declare const brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [brand]: Name };
type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

function loadUser(id: UserId): void {}
declare const userId: UserId;
declare const orderId: OrderId;
loadUser(userId);
// loadUser(orderId); // compile-time error
```

Создание branded value нужно централизовать за валидатором/конструктором; assertion вручную может обойти маркер, а runtime-строка не содержит brand. Классы с private/protected членами также могут дать nominal-подобную совместимость, но добавляют runtime/наследование и часто не нужны лишь ради различения ID.

### Branded types.
<!-- question-id: fullstack-interview-04-typescript-advanced-024 -->

#### Ответ

Branded type пересекает базовый тип со скрытым маркером, чтобы различать значения одной runtime-формы: UserId и OrderId оба string, но не взаимозаменяемы для компилятора. Это помогает предотвращать перепутанные ID, валюты или значения после validation. В production бренд следует выдавать только через границу, которая действительно проверила инвариант: parseUserId(unknown): Result<UserId, ValidationError>. Сам бренд не проверяет формат, не шифрует и не защищает от explicit assertion/any; он стирается при сборке и не сохраняется в JSON. Уникальный symbol уменьшает случайное структурное совпадение, а readonly-маркер не даёт менять его через branded ссылку.
