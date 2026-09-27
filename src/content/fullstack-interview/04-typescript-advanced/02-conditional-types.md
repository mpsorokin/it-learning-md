# Conditional types и distributivity

## Interview questions

### Что такое infer?
<!-- question-id: fullstack-interview-04-typescript-advanced-006 -->

#### Ответ

infer объявляет локальную переменную типа внутри шаблона conditional type, чтобы извлечь компонент типа, если проверяемый тип совместим с шаблоном. Например, T extends Promise<infer U> ? U : T связывает U с типом внутри Promise. infer действует только в true-ветке соответствующего условного типа и не является generic-параметром runtime-функции. Если в шаблоне несколько кандидатов, TS объединяет или пересекает их в зависимости от позиции и variance; для функции с overloads вывод часто видит последнюю сигнатуру. infer облегчает метапрограммирование, но вложенные шаблоны могут стать сложнее для диагностики, чем именованный промежуточный alias.

### Где можно использовать infer?
<!-- question-id: fullstack-interview-04-typescript-advanced-007 -->

#### Ответ

`infer` применяется в extends-части условного типа, внутри типа-шаблона, из которого нужно извлечь составляющие. Например, результат функции можно вывести без требования, чтобы она принимала произвольные `unknown`-аргументы:

```ts
type GetReturnType<T> = T extends (...args: never[]) => infer R ? R : never;

type TypedArgsResult = GetReturnType<(id: string, force?: boolean) => Promise<number>>;
const validResult: TypedArgsResult = Promise.resolve(42);
// @ts-expect-error результат остаётся Promise<number>
const invalidResult: TypedArgsResult = Promise.resolve("42");
```

`never[]` здесь служит шаблоном сигнатуры, совместимым с функциями с конкретными типами параметров; `unknown[]` потребовал бы, чтобы функция принимала любое значение. Другие распространённые примеры: аргументы из `(...args: infer P) => unknown`, элемент массива через `readonly (infer U)[]`, ключ/значение Map через `ReadonlyMap<infer K, infer V>` либо часть строкового tuple. TypeScript 4.7 добавил constraints для infer-переменных, например `infer U extends string`. Результат доступен только в true-ветке, где pattern match удался; false-ветка может выбрать fallback. Для generic/overloaded callable есть ограничения вывода: нельзя считать, что будут собраны все конкретные вызовы.

### Как работает distributive conditional type?
<!-- question-id: fullstack-interview-04-typescript-advanced-008 -->

#### Ответ

Если проверяемая сторона условного типа — naked type parameter, то при инстанцировании union TS применяет условие отдельно к каждому участнику и затем объединяет результаты. Например, type Box<T> = T extends unknown ? { value: T } : never превращает string | number в { value: string } | { value: number }. Так реализованы Exclude и Extract. Это полезно для map/filter по union, но может нежелательно превратить коррелированную комбинацию в слишком широкий union. Нюансы: для T = never distributive результат — never (нет участников для обработки), а any может дать объединение условных ветвей.

Это compile-time преобразование, которое удобно проверять отдельными типовыми тестами с директивой @ts-expect-error и равенством типов.

### Как отключить distributivity?
<!-- question-id: fullstack-interview-04-typescript-advanced-009 -->

#### Ответ

Нужно, чтобы проверяемый тип перестал быть naked type parameter, обычно заключить обе стороны условия в tuple: type IsAllString<T> = [T] extends [string] ? true : false. Тогда string | number сравнивается целиком и результат false; у варианта T extends string ответ был бы true | false после распределения. Другой wrapper, например { value: T } extends { value: U }, тоже отключает distributivity, но tuple является привычным идиоматическим решением. Обёртка меняет и смысл assignability для некоторых необычных типов, поэтому используйте ту, которая точно выражает вопрос «весь union или каждый член».

### Что такое recursive types?
<!-- question-id: fullstack-interview-04-typescript-advanced-010 -->

#### Ответ

Recursive type — тип, который ссылается на себя напрямую или через другой тип: например JSON как примитив | массив JSON | словарь JSON или дерево с children: Tree[]. Он моделирует естественно вложенные данные и используется также в recursive utility types. TypeScript поддерживает многие рекурсивные формы, но вычисление имеет пределы: чрезмерная глубина, ширина union или взаимная рекурсия могут вызвать ошибку excessive type instantiation и ухудшить IntelliSense/build. Задайте базовые случаи и явно решите, как обрабатывать функции, массивы, классы и специальные объекты. Тип не гарантирует, что реальное значение конечно или не содержит циклов; runtime traversal должен отдельно иметь защиту от циклов/глубины.
