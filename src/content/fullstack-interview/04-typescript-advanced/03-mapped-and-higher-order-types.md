# Mapped и higher-order types

## Interview questions

### Что такое higher-order types?
<!-- question-id: fullstack-interview-04-typescript-advanced-011 -->

#### Ответ

Это не специальная конструкция TypeScript, а обычно неформальное название типов, которые принимают другие типы и строят из них новые: generic aliases, mapped/conditional types, функции-преобразования над ключами и union. Например, Partial<T> берёт тип и возвращает преобразованную форму. Важно отличать это от higher-kinded types в функциональных языках: TS не предоставляет полноценный параметр «типовой конструктор F», который можно абстрактно применять как F<T>; такие API обычно эмулируют через интерфейс с членом type или helper aliases, имея ограничения. Сложные трансформации следует разделять на именованные шаги и проверять на границах, иначе диагностики становятся нечитаемыми.

### Что такое mapped type?
<!-- question-id: fullstack-interview-04-typescript-advanced-012 -->

#### Ответ

Mapped type отображает множество ключей исходного типа в новый набор свойств и обычно сохраняет соответствующие типы значений: { [K in keyof T]: T[K] }. Можно добавить или снять readonly/optional префиксами readonly, ?, + и -, либо вычислить тип значения условием. Например, Readonly<T> добавляет readonly каждому ключу. Этот механизм не итерируется по объекту в runtime: он полностью стирается при компиляции и не меняет объект. Современный TS также сохраняет специальные свойства массивов/tuple при типичных homomorphic mapped forms, поэтому полезно применять именно keyof T, если нужно перенести их структуру.

### Что такое conditional mapped type?
<!-- question-id: fullstack-interview-04-typescript-advanced-013 -->

#### Ответ

Обычно так называют комбинацию mapped type и conditional type, где для каждого ключа вычисляется своя ветка. Важно различать замену типа значения и удаление самого ключа: mapped type ниже сохраняет callable-поле, но делает его значение `never`.

```ts
type Callable = (...args: any[]) => unknown;

type ReplaceCallableValuesWithNever<T> = {
  [K in keyof T]: NonNullable<T[K]> extends Callable ? never : T[K];
};

type OmitCallableProperties<T> = {
  [K in keyof T as NonNullable<T[K]> extends Callable ? never : K]: T[K];
};

type Model = {
  id: string;
  onSave?: (value: string) => void;
  label: string | (() => string);
};

type Nevered = ReplaceCallableValuesWithNever<Model>;
// onSave?: never — ключ остаётся, но callable-значение запрещено.

type WithoutCallableProperties = OmitCallableProperties<Model>;
// Удаляется onSave; label остаётся, потому что весь его тип не callable.
```

`NonNullable` позволяет одинаково обработать optional callable-свойство: `never`-вариант сохраняет его optional-модификатор, а key-remapping-вариант удаляет ключ. Если политика должна удалять поле при наличии любого callable-члена union, вместо проверки всего типа используйте `Extract<NonNullable<T[K]>, Callable> extends never`. У mapped-полей с optional-модификатором сохраняйте или снимайте `?` осознанно: это влияет на результат, но не меняет отличие между `never`-значением и отсутствующим ключом.

### Что такое key remapping через as?
<!-- question-id: fullstack-interview-04-typescript-advanced-014 -->

#### Ответ

В mapped type clause можно изменить ключ через as: { [K in keyof T as NewKey<K>]: T[K] }. Это удобно для префиксов/суффиксов и фильтрации; если результатом для ключа является never, свойство исключается. Например, type Getters<T> = { [K in keyof T as K extends string ? `get${Capitalize<K>}` : never]: () => T[K] } строит методы по string-полям. Помните о возможной коллизии: разные исходные ключи могут быть отображены в один ключ, тогда типы объединятся/пересекутся согласно правилам построения. Для широких index signatures template literal expansion может быть дорогой для компилятора.

### Что такое satisfies?
<!-- question-id: fullstack-interview-04-typescript-advanced-015 -->

#### Ответ

satisfies (TypeScript 4.9+; [release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)) проверяет, что выражение assignable к заданному контракту, но не заменяет тип выражения этим контрактом, как явная аннотация. Это помогает ловить пропущенные/лишние ключи у fresh object literal и при этом сохранять литеральную информацию для последующего доступа. Например, объект маршрутов satisfies Record<RouteName, RouteConfig> проверит набор ключей, а route-specific поля останутся более точными. Оператор не является runtime-validation и не гарантирует точный тип произвольной переменной. Контекстная типизация всё ещё может влиять на вывод вложенных функций/литералов. Если нужно изменить тип/сузить его, это уже задача явной аннотации, generic-функции или type assertion — у каждого иной контракт.
