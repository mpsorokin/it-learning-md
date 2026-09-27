# Literal inference, satisfies и const generics

## Interview questions

### satisfies vs type assertion.
<!-- question-id: fullstack-interview-04-typescript-advanced-016 -->

#### Ответ

satisfies проверяет, что выражение assignable к целевому типу, сохраняя выведенный тип выражения для дальнейшего использования; type assertion (expr as T) просит компилятор трактовать выражение как T и может скрыть ошибку, если типы достаточно перекрываются. Например, config satisfies Record<"dev" | "prod", Options> проверит набор ключей и значения, но не превратит каждое свойство в общий Options. Assertion полезен при неполном знании компилятора (например, после внешней проверки), но не выполняет cast в runtime и не валидирует данные. Для недоверенного JSON нужна проверка, не assertion. satisfies добавлен в TS 4.9; используйте версию compiler, поддерживающую синтаксис.

### as const.
<!-- question-id: fullstack-interview-04-typescript-advanced-017 -->

#### Ответ

Const assertion просит TS не расширять литеральные типы выражения и трактовать массив как readonly tuple, а свойства object literal — как readonly. Например, const directions = ["north", "south"] as const получает тип readonly ["north", "south"], а не string[]. Это compile-time эффект: объект не заморожен, вложенные ссылки и mutable методы runtime остаются. Assertion работает для непосредственных литералов и не возвращает потерянную конкретность у уже расширенной переменной. Полезен для конфигураций/константных таблиц, но может мешать API, который ожидает mutable tuple/array; не делайте весь прикладной state readonly без соответствующего ownership-дизайна.

### const generic parameters.
<!-- question-id: fullstack-interview-04-typescript-advanced-018 -->

#### Ответ

const type parameter (TypeScript 5.0+; [release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)) включает const-like inference по умолчанию для соответствующего аргумента — особенно для inline массивов и object literals. Так автор API может сохранить tuple и literal unions без требования писать as const у каждого вызова:

```ts
function tuple<const T extends readonly unknown[]>(value: T): T {
  return value;
}

const result = tuple(["ready", 200]); // readonly ["ready", 200]
```

Модификатор влияет на вывод, но не делает runtime-значение неизменяемым и не предотвращает explicit widening. Ограничение должно принимать readonly inference; mutable constraint может заставить компилятор выбрать fallback-тип, потому что inferred readonly tuple не assignable к mutable array. Уже widened variable не станет литеральным снова. Feature требует TypeScript 5.0+.

### Почему:
<!-- question-id: fullstack-interview-04-typescript-advanced-019 -->

```ts
function foo<const T>(value: T)
```

может сохранить literal information лучше обычного generic?

#### Ответ

Обычный generic inference выбирает наиболее удобный общий тип для дальнейшего использования; у inline array literal это часто string[] или number[], чтобы вызывающий мог его менять. const modifier просит сохранить более специфичный литеральный тип — readonly tuple и literal values — когда он совместим с constraint. Это особенно полезно для API, где tuple отражает точное число/порядок аргументов или объект-конфигурация определяет допустимые ключи. Наглядно:

```ts
function ordinary<T extends readonly string[]>(value: T): T { return value; }
function exact<const T extends readonly string[]>(value: T): T { return value; }

const broad = ordinary(["open", "closed"]); // обычно string[]
const exactValue = exact(["open", "closed"]); // readonly ["open", "closed"]
```

Const inference не действует как runtime const и не отменяет widening до вызова: если сначала сохранить массив в переменную типа string[], конкретные литералы уже потеряны. Типовой вывод также ограничен совместимостью с constraint; для сохранения readonly tuple constraint должен быть readonly.
